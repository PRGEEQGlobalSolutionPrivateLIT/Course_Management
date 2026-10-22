'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';

import {
  EditorContent,
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
  type Editor as TiptapEditor,
  type NodeViewProps,
} from '@tiptap/react';
import { Extension, Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { DOMOutputSpec } from '@tiptap/pm/model';

import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';

import {
  BulletList,
  ListItem,
  ListKeymap,
  OrderedList,
  TaskItem,
  TaskList,
} from '@tiptap/extension-list';

import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-text-style/font-family';
import { FontSize } from '@tiptap/extension-text-style/font-size';

import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';

import { Table } from '@tiptap/extension-table/table';
import { TableRow } from '@tiptap/extension-table/row';
import { TableHeader } from '@tiptap/extension-table/header';
import { TableCell } from '@tiptap/extension-table/cell';

import { Image as TiptapImage } from '@tiptap/extension-image';
import { Mathematics } from '@tiptap/extension-mathematics';

import {
  Accessibility,
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  BarChart3,
  Bookmark,
  Bot,
  BookOpen,
  Bold,
  Braces,
  CheckCircle2,
  Clock3,
  Code2,
  Columns3,
  Copy,
  Eraser,
  Eye,
  FileDown,
  FilePlus2,
  FileText,
  GraduationCap,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Highlighter,
  History,
  Image as ImageIcon,
  Indent,
  Info,
  Italic,
  Keyboard,
  Languages,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Mail,
  Maximize2,
  MessageSquare,
  Minimize2,
  Minus,
  MousePointer2,
  Outdent,
  Palette,
  PanelTop,
  Plus,
  Printer,
  Quote,
  Redo2,
  RotateCw,
  Save,
  Search,
  ShieldCheck,
  Sigma,
  Sparkles,
  Strikethrough,
  Table2,
  Tags,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
  Video,
  Volume2,
  VolumeX,
  WrapText,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import styles from './AppTextEditor.module.css';

const TEXT_EDITOR_REQUEST_STORAGE_KEY =
  'neurolxp_text_editor_request';

const TEXT_EDITOR_RESULT_STORAGE_KEY =
  'neurolxp_text_editor_result';

const TEXT_EDITOR_FILE_DATABASE_NAME =
  'neurolxp-text-editor-files';

const TEXT_EDITOR_FILE_DATABASE_VERSION = 1;

const TEXT_EDITOR_FILE_STORE_NAME =
  'files';

export type AppTextEditorValue = {
  html: string;
  plain_text: string;
  json_content?: unknown;
};

type SyllabusBuilderEditorTarget =
  | 'syllabus-description'
  | 'module-objective'
  | 'module-description'
  | 'unit-description'
  | 'topic-description'
  | 'resource-description'
  | 'resource-file-content'
  | 'resource-new-file'
  | 'content-body'
  | 'content-new-file';

type SyllabusBuilderEditorRequest = {
  requestId: string;
  source: 'syllabus-builder';
  targetType: SyllabusBuilderEditorTarget;
  label: string;
  content: string;
  courseId: string;
  syllabusId: string;
  moduleId: string;
  unitId: string;
  topicId: string;
  resourceId: string;
  contentBlockId: string;
  returnUrl: string;
  createdAt: string;
  fileName?: string;
  mimeType?: string;
  resourceType?: string;
  fileDataUrl?: string;
  fileStorageKey?: string;
  editorMode?: 'edit-uploaded-file' | 'create-new-file';
  requestedOutputFormat?: 'docx' | 'txt' | 'pdf';
  allowedOutputFormats?: Array<'docx' | 'txt' | 'pdf'>;
};

type SyllabusBuilderEditorResult = {
  requestId: string;
  source: 'syllabus-builder';
  confirmed: boolean;
  targetType: SyllabusBuilderEditorTarget;
  content: string;
  courseId: string;
  syllabusId: string;
  moduleId: string;
  unitId: string;
  topicId: string;
  resourceId: string;
  contentBlockId: string;
  savedAt: string;
  outputFormat?: 'docx' | 'txt' | 'pdf';
  fileName?: string;
  mimeType?: string;
  fileSize?: string;
  fileDataUrl?: string;
  fileStorageKey?: string;
};

type EditorMode = 'write' | 'preview' | 'split';

type SaveStatus = 'idle' | 'typing' | 'saved';

type RibbonTab =
  | 'file'
  | 'home'
  | 'insert'
  | 'design'
  | 'layout'
  | 'references'
  | 'mailings'
  | 'review'
  | 'view'
  | 'help'
  | 'acrobat'
  | 'academic'
  | 'ai';

export type AiEditorAction =
  | 'summarize'
  | 'improve'
  | 'generate_outcomes'
  | 'syllabus_to_units'
  | 'map_skills'
  | 'generate_quiz'
  | 'translate';

export type CourseOutcomeOption = {
  id: string;
  code: string;
  title?: string;
};

type EditorComment = {
  id: string;
  text: string;
  created_at: string;
};

type EditorVersion = {
  id: string;
  title: string;
  value: AppTextEditorValue;
  created_at: string;
};

type AiEditorContext = {
  tenantType?: string;
  courseTitle?: string;
  courseCode?: string;
  programmeName?: string;
  semester?: string;
  subjectArea?: string;
  level?: string;
  audience?: string;
};

type AcademicTemplateType =
  | 'course_overview'
  | 'unit_plan'
  | 'lesson_plan'
  | 'assessment_blueprint'
  | 'rubric'
  | 'clo_table'
  | 'weekly_plan'
  | 'lab_record'
  | 'reading_list'
  | 'approval_note'
  | 'syllabus_unit_wise'
  | 'syllabus_module_wise'
  | 'syllabus_chapter_wise'
  | 'syllabus_topic_wise'
  | 'syllabus_custom';

type CoverPageTemplateType =
  | 'academicReport'
  | 'courseAssignment'
  | 'projectReport'
  | 'trainingModule'
  | 'minimalDocument';

type HeaderTemplateType =
  | 'documentTitle'
  | 'courseUnit'
  | 'confidential'
  | 'draftReview'
  | 'minimal';

type FooterTemplateType =
  | 'pageFooter'
  | 'preparedBy'
  | 'confidentialFooter'
  | 'approvalFooter'
  | 'minimalFooter';

type SignatureLineTemplateType =
  | 'basicSignature'
  | 'nameDateSignature'
  | 'approvalSignature'
  | 'facultyApprovalSignature'
  | 'digitalSignature'
  | 'initialsSignature';

type SignaturePromptField = {
  key: string;
  label: string;
  defaultValue: string;
  placeholder: string;
};

type SignaturePromptConfig = {
  templateType: SignatureLineTemplateType;
  title: string;
  description: string;
  fields: SignaturePromptField[];
};

type SmartArtCategory =
  | 'All'
  | 'List'
  | 'Process'
  | 'Cycle'
  | 'Hierarchy'
  | 'Relationship'
  | 'Matrix'
  | 'Pyramid'
  | 'Picture';

type SmartArtTemplateType =
  | 'basicBlockList'
  | 'verticalBulletList'
  | 'pictureList'
  | 'process'
  | 'chevronProcess'
  | 'cycle'
  | 'hierarchy'
  | 'relationship'
  | 'matrix'
  | 'pyramid'
  | 'pictureCaptionList';

type EditableChartCategory =
  | 'All Charts'
  | 'Recent'
  | 'Templates'
  | 'Column'
  | 'Line'
  | 'Pie'
  | 'Bar'
  | 'Area'
  | 'X Y (Scatter)'
  | 'Map'
  | 'Stock'
  | 'Surface'
  | 'Radar'
  | 'Treemap'
  | 'Sunburst'
  | 'Histogram'
  | 'Box & Whisker'
  | 'Waterfall'
  | 'Funnel'
  | 'Combo';

type EditableChartType =
  | 'column'
  | 'stackedColumn'
  | 'line'
  | 'pie'
  | 'doughnut'
  | 'bar'
  | 'area'
  | 'scatter'
  | 'map'
  | 'stock'
  | 'surface'
  | 'radar'
  | 'treemap'
  | 'sunburst'
  | 'histogram'
  | 'boxWhisker'
  | 'waterfall'
  | 'funnel'
  | 'combo';

type CitationSource = {
  id: string;
  label: string;
  citation: string;
  created_at: string;
};

type EditorBookmark = {
  id: string;
  name: string;
  position: number;
};

type EquationDisplayMode = 'block' | 'inline';

type EquationEditEventDetail = {
  editorId: string;
  position: number;
  latex: string;
  display: EquationDisplayMode;
};

type HomeDropdownType =
  | 'fontFamily'
  | 'fontSize'
  | 'textColor'
  | 'highlightColor'
  | 'paragraphPreset'
  | 'lineSpacing'
  | 'bulletStyle'
  | 'numberStyle'
  | 'textCase'
  | 'chartTemplate'
  | 'smartArtTemplate'
  | null;

type HomeDropdownKey = Exclude<HomeDropdownType, null>;

type HomeDropdownOption = {
  label: string;
  value: string;
  marker?: string;
  color?: string;
  description?: string;
};

type HomeDropdownPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

type TableDomSelectionSnapshot = {
  tableIndex: number;
  rowIndex: number;
  cellIndex: number;
};

type LayoutMarginPreset = 'normal' | 'narrow' | 'wide' | 'mirrored' | 'custom';
type LayoutPageSizePreset = 'A4' | 'Letter' | 'Legal';
type LayoutColumnPreset = '1' | '2' | '3' | 'left' | 'right';
type LayoutPageViewPreset = 'normal' | 'compact';
type TableOfContentsPreset =
  | 'classicHeading'
  | 'numbered'
  | 'bullet'
  | 'expandable'
  | 'stickySidebar'
  | 'interactiveHyperlinked'
  | 'treeView'
  | 'mini'
  | 'pageNumber'
  | 'custom';

type EditorNoteType = 'footnote' | 'endnote';

type EditorFootnote = {
  id: string;
  type: EditorNoteType;
  number: number;
  text: string;
  created_at: string;
};

type FootnoteNumberFormat = 'decimal' | 'lower-alpha' | 'lower-roman' | 'symbols';

type FootnoteSettings = {
  numberFormat: FootnoteNumberFormat;
  footnoteLocation: 'bottom-of-page' | 'below-text';
  endnoteLocation: 'end-of-document' | 'end-of-section';
  restartRule: 'continuous' | 'each-section' | 'each-page';
};

type AppTextEditorProps = {
  id: string;
  label: string;

  value?: AppTextEditorValue;
  onChange?: (value: AppTextEditorValue) => void;
  defaultValue?: AppTextEditorValue;

  placeholder?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  minRows?: number;
  fullEditorHref?: string;
  disabled?: boolean;

  showPreview?: boolean;
  defaultMode?: EditorMode;
  allowFullscreen?: boolean;
  maxLength?: number;

  enableAutosave?: boolean;
  storageKey?: string;
  autosaveDelayMs?: number;
  onAutosave?: (value: AppTextEditorValue) => void;

  enableUniversityTools?: boolean;
  enableAiTools?: boolean;
  enableFormulaTools?: boolean;
  enableImageUpload?: boolean;
  enableVersionHistory?: boolean;
  enableComments?: boolean;
  enableApprovalRemarks?: boolean;

  courseOutcomes?: CourseOutcomeOption[];
  skillTags?: string[];

  onImageUpload?: (file: File) => Promise<string>;
  onExportPdf?: (value: AppTextEditorValue) => void;

  onAiAction?: (
    action: AiEditorAction,
    value: AppTextEditorValue
  ) => Promise<AppTextEditorValue | string | void>;

  aiEndpoint?: string;
  aiContext?: AiEditorContext;
  targetLanguage?: string;

  onApprovalRemarkChange?: (remark: string) => void;
};

export const emptyEditorValue: AppTextEditorValue = {
  html: '',
  plain_text: '',
  json_content: null,
};

const ribbonTabs: {
  id: RibbonTab;
  label: string;
}[] = [
  { id: 'file', label: 'File' },
  { id: 'home', label: 'Home' },
  { id: 'insert', label: 'Insert' },
  { id: 'design', label: 'Design' },
  { id: 'layout', label: 'Layout' },
  { id: 'references', label: 'References' },
  { id: 'mailings', label: 'Mailings' },
  { id: 'review', label: 'Review' },
  { id: 'view', label: 'View' },
  { id: 'help', label: 'Help' },
  { id: 'acrobat', label: 'Acrobat' },
  { id: 'academic', label: 'Academic' },
  { id: 'ai', label: 'AI Flow' },
];

const fontFamilyOptions = [
  { label: 'Aptos', value: 'Aptos, Calibri, Candara, Segoe, sans-serif' },
  { label: 'Aptos Display', value: '"Aptos Display", Aptos, Calibri, sans-serif' },
  { label: 'Aptos Mono', value: '"Aptos Mono", Consolas, "Courier New", monospace' },
  { label: 'Calibri', value: 'Calibri, Candara, Segoe, sans-serif' },
  { label: 'Cambria', value: 'Cambria, Georgia, serif' },
  { label: 'Candara', value: 'Candara, Calibri, Segoe, sans-serif' },
  { label: 'Consolas', value: 'Consolas, "Courier New", monospace' },
  { label: 'Constantia', value: 'Constantia, Georgia, serif' },
  { label: 'Corbel', value: 'Corbel, "Segoe UI", Arial, sans-serif' },
  { label: 'Segoe UI', value: '"Segoe UI", Roboto, sans-serif' },
  { label: 'Segoe UI Black', value: '"Segoe UI Black", "Arial Black", sans-serif' },
  { label: 'Segoe UI Historic', value: '"Segoe UI Historic", "Segoe UI", sans-serif' },
  { label: 'Segoe UI Light', value: '"Segoe UI Light", "Segoe UI", sans-serif' },
  { label: 'Segoe UI Semibold', value: '"Segoe UI Semibold", "Segoe UI", sans-serif' },
  { label: 'Segoe UI Symbol', value: '"Segoe UI Symbol", "Segoe UI", sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Arial Black', value: '"Arial Black", Arial, Helvetica, sans-serif' },
  { label: 'Arial Narrow', value: '"Arial Narrow", Arial, Helvetica, sans-serif' },
  { label: 'Arial Rounded MT Bold', value: '"Arial Rounded MT Bold", Arial, sans-serif' },
  { label: 'Bahnschrift', value: 'Bahnschrift, "Segoe UI", Arial, sans-serif' },
  { label: 'Book Antiqua', value: '"Book Antiqua", Palatino, Georgia, serif' },
  { label: 'Bookman Old Style', value: '"Bookman Old Style", Georgia, serif' },
  { label: 'Century', value: 'Century, Georgia, serif' },
  { label: 'Century Gothic', value: '"Century Gothic", AppleGothic, Arial, sans-serif' },
  { label: 'Comic Sans MS', value: '"Comic Sans MS", "Comic Sans", cursive' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'Franklin Gothic Book', value: '"Franklin Gothic Book", "Arial Narrow", Arial, sans-serif' },
  { label: 'Franklin Gothic Medium', value: '"Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif' },
  { label: 'Garamond', value: 'Garamond, Baskerville, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Gill Sans', value: '"Gill Sans", "Gill Sans MT", Calibri, sans-serif' },
  { label: 'Impact', value: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif' },
  { label: 'Lucida Bright', value: '"Lucida Bright", Georgia, serif' },
  { label: 'Lucida Console', value: '"Lucida Console", Monaco, monospace' },
  { label: 'Lucida Sans', value: '"Lucida Sans Unicode", "Lucida Grande", Arial, sans-serif' },
  { label: 'Lucida Sans Typewriter', value: '"Lucida Sans Typewriter", "Lucida Console", monospace' },
  { label: 'Microsoft JhengHei', value: '"Microsoft JhengHei", "Segoe UI", sans-serif' },
  { label: 'Microsoft New Tai Lue', value: '"Microsoft New Tai Lue", "Segoe UI", sans-serif' },
  { label: 'Microsoft PhagsPa', value: '"Microsoft PhagsPa", "Segoe UI", sans-serif' },
  { label: 'Microsoft Sans Serif', value: '"Microsoft Sans Serif", Arial, sans-serif' },
  { label: 'Microsoft Tai Le', value: '"Microsoft Tai Le", "Segoe UI", sans-serif' },
  { label: 'Microsoft YaHei', value: '"Microsoft YaHei", "Segoe UI", sans-serif' },
  { label: 'MingLiU', value: 'MingLiU, "Microsoft JhengHei", serif' },
  { label: 'MS Gothic', value: '"MS Gothic", "Yu Gothic", monospace' },
  { label: 'MS Mincho', value: '"MS Mincho", "Yu Mincho", serif' },
  { label: 'Palatino Linotype', value: '"Palatino Linotype", Palatino, Georgia, serif' },
  { label: 'Perpetua', value: 'Perpetua, Georgia, serif' },
  { label: 'Rockwell', value: 'Rockwell, Georgia, serif' },
  { label: 'SimSun', value: 'SimSun, "Microsoft YaHei", serif' },
  { label: 'Sitka', value: 'Sitka, Georgia, serif' },
  { label: 'Sylfaen', value: 'Sylfaen, Georgia, serif' },
  { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", Arial, sans-serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Yu Gothic', value: '"Yu Gothic", "Microsoft YaHei", sans-serif' },
  { label: 'Yu Mincho', value: '"Yu Mincho", "MS Mincho", serif' },
  { label: 'American Typewriter', value: '"American Typewriter", Georgia, serif' },
  { label: 'Andale Mono', value: '"Andale Mono", Consolas, monospace' },
  { label: 'Apple Chancery', value: '"Apple Chancery", cursive' },
  { label: 'Apple Color Emoji', value: '"Apple Color Emoji", "Segoe UI Emoji", sans-serif' },
  { label: 'Avenir', value: 'Avenir, "Segoe UI", Arial, sans-serif' },
  { label: 'Avenir Next', value: '"Avenir Next", Avenir, "Segoe UI", Arial, sans-serif' },
  { label: 'Baskerville', value: 'Baskerville, "Libre Baskerville", Georgia, serif' },
  { label: 'Big Caslon', value: '"Big Caslon", Georgia, serif' },
  { label: 'Bodoni 72', value: '"Bodoni 72", Didot, Georgia, serif' },
  { label: 'Bradley Hand', value: '"Bradley Hand", "Comic Sans MS", cursive' },
  { label: 'Chalkboard', value: 'Chalkboard, "Comic Sans MS", cursive' },
  { label: 'Chalkboard SE', value: '"Chalkboard SE", Chalkboard, cursive' },
  { label: 'Charter', value: 'Charter, Georgia, serif' },
  { label: 'Cochin', value: 'Cochin, Georgia, serif' },
  { label: 'Copperplate', value: 'Copperplate, "Copperplate Gothic Light", fantasy' },
  { label: 'Didot', value: 'Didot, "Bodoni 72", Georgia, serif' },
  { label: 'Futura', value: 'Futura, "Trebuchet MS", Arial, sans-serif' },
  { label: 'Geneva', value: 'Geneva, Verdana, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { label: 'Helvetica Neue', value: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  { label: 'Hoefler Text', value: '"Hoefler Text", Georgia, serif' },
  { label: 'Marker Felt', value: '"Marker Felt", fantasy' },
  { label: 'Menlo', value: 'Menlo, Consolas, "Courier New", monospace' },
  { label: 'Monaco', value: 'Monaco, Consolas, "Courier New", monospace' },
  { label: 'New York', value: '"New York", Georgia, serif' },
  { label: 'Noteworthy', value: 'Noteworthy, "Comic Sans MS", cursive' },
  { label: 'Optima', value: 'Optima, Candara, Arial, sans-serif' },
  { label: 'Papyrus', value: 'Papyrus, fantasy' },
  { label: 'Phosphate', value: 'Phosphate, Impact, fantasy' },
  { label: 'Savoye LET', value: '"Savoye LET", cursive' },
  { label: 'Skia', value: 'Skia, "Segoe UI", sans-serif' },
  { label: 'Snell Roundhand', value: '"Snell Roundhand", cursive' },
  { label: 'System UI', value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  { label: 'Academy Engraved LET', value: '"Academy Engraved LET", Georgia, serif' },
  { label: 'Al Nile', value: '"Al Nile", Arial, sans-serif' },
  { label: 'Al Tarikh', value: '"Al Tarikh", Arial, sans-serif' },
  { label: 'Arial Hebrew', value: '"Arial Hebrew", Arial, sans-serif' },
  { label: 'Arial Unicode MS', value: '"Arial Unicode MS", Arial, sans-serif' },
  { label: 'Baghdad', value: 'Baghdad, Arial, sans-serif' },
  { label: 'Beirut', value: 'Beirut, Arial, sans-serif' },
  { label: 'Damascus', value: 'Damascus, Arial, sans-serif' },
  { label: 'Devanagari Sangam MN', value: '"Devanagari Sangam MN", "Noto Sans Devanagari", sans-serif' },
  { label: 'Gujarati Sangam MN', value: '"Gujarati Sangam MN", "Noto Sans Gujarati", sans-serif' },
  { label: 'Gurmukhi MN', value: '"Gurmukhi MN", "Noto Sans Gurmukhi", sans-serif' },
  { label: 'Hiragino Sans', value: '"Hiragino Sans", "Yu Gothic", sans-serif' },
  { label: 'Kannada Sangam MN', value: '"Kannada Sangam MN", "Noto Sans Kannada", sans-serif' },
  { label: 'Malayalam Sangam MN', value: '"Malayalam Sangam MN", "Noto Sans Malayalam", sans-serif' },
  { label: 'Tamil Sangam MN', value: '"Tamil Sangam MN", "Noto Sans Tamil", sans-serif' },
  { label: 'Telugu Sangam MN', value: '"Telugu Sangam MN", "Noto Sans Telugu", sans-serif' },
  { label: 'Thonburi', value: 'Thonburi, Arial, sans-serif' },
  { label: 'Kohinoor Devanagari', value: '"Kohinoor Devanagari", "Noto Sans Devanagari", sans-serif' },
  { label: 'Kohinoor Telugu', value: '"Kohinoor Telugu", "Noto Sans Telugu", sans-serif' },
  { label: 'Kohinoor Bangla', value: '"Kohinoor Bangla", "Noto Sans Bengali", sans-serif' },
  { label: 'Lao MN', value: '"Lao MN", Arial, sans-serif' },
  { label: 'Sinhala MN', value: '"Sinhala MN", Arial, sans-serif' },
  { label: 'Noto Sans', value: '"Noto Sans", Arial, sans-serif' },
  { label: 'Noto Serif', value: '"Noto Serif", Georgia, serif' },
  { label: 'Noto Sans Devanagari', value: '"Noto Sans Devanagari", "Devanagari Sangam MN", sans-serif' },
  { label: 'Noto Sans Tamil', value: '"Noto Sans Tamil", "Tamil Sangam MN", sans-serif' },
  { label: 'Noto Sans Telugu', value: '"Noto Sans Telugu", "Telugu Sangam MN", sans-serif' },
  { label: 'Noto Sans Malayalam', value: '"Noto Sans Malayalam", "Malayalam Sangam MN", sans-serif' },
  { label: 'Noto Sans Kannada', value: '"Noto Sans Kannada", "Kannada Sangam MN", sans-serif' },
  { label: 'Noto Sans Bengali', value: '"Noto Sans Bengali", "Kohinoor Bangla", sans-serif' },
  { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { label: 'Roboto', value: 'Roboto, Arial, sans-serif' },
  { label: 'Roboto Condensed', value: '"Roboto Condensed", Arial, sans-serif' },
  { label: 'Roboto Mono', value: '"Roboto Mono", Consolas, "Courier New", monospace' },
  { label: 'Open Sans', value: '"Open Sans", Arial, sans-serif' },
  { label: 'Lato', value: 'Lato, Arial, sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, Arial, sans-serif' },
  { label: 'Poppins', value: 'Poppins, Arial, sans-serif' },
  { label: 'Nunito Sans', value: '"Nunito Sans", Arial, sans-serif' },
  { label: 'Merriweather', value: 'Merriweather, Georgia, serif' },
  { label: 'Playfair Display', value: '"Playfair Display", Georgia, serif' },
  { label: 'Libre Baskerville', value: '"Libre Baskerville", Georgia, serif' },
  { label: 'Source Sans 3', value: '"Source Sans 3", Arial, sans-serif' },
  { label: 'Source Serif 4', value: '"Source Serif 4", Georgia, serif' },
  { label: 'IBM Plex Sans', value: '"IBM Plex Sans", Arial, sans-serif' },
  { label: 'IBM Plex Serif', value: '"IBM Plex Serif", Georgia, serif' },
  { label: 'IBM Plex Mono', value: '"IBM Plex Mono", Consolas, monospace' },
  { label: 'Ubuntu', value: 'Ubuntu, Arial, sans-serif' },
  { label: 'Fira Sans', value: '"Fira Sans", Arial, sans-serif' },
  { label: 'Fira Code', value: '"Fira Code", Consolas, "Courier New", monospace' },
  { label: 'Josefin Sans', value: '"Josefin Sans", Arial, sans-serif' },
  { label: 'Oswald', value: 'Oswald, Arial, sans-serif' },
  { label: 'Raleway', value: 'Raleway, Arial, sans-serif' },
  { label: 'PT Sans', value: '"PT Sans", Arial, sans-serif' },
  { label: 'PT Serif', value: '"PT Serif", Georgia, serif' },
  { label: 'Work Sans', value: '"Work Sans", Arial, sans-serif' },
  { label: 'Quicksand', value: 'Quicksand, Arial, sans-serif' },
  { label: 'Rubik', value: 'Rubik, Arial, sans-serif' },
  { label: 'Mulish', value: 'Mulish, Arial, sans-serif' },
  { label: 'Manrope', value: 'Manrope, Arial, sans-serif' },
  { label: 'DM Sans', value: '"DM Sans", Arial, sans-serif' },
  { label: 'Lexend', value: 'Lexend, Arial, sans-serif' },
  { label: 'Lora', value: 'Lora, Georgia, serif' },
  { label: 'Crimson Text', value: '"Crimson Text", Georgia, serif' },
];

const fontSizeOptions = [
  '8',
  '9',
  '10',
  '11',
  '12',
  '14',
  '16',
  '18',
  '20',
  '22',
  '24',
  '26',
  '28',
  '36',
  '48',
  '72',
];

const colorOptions = [
  { label: 'Dark Charcoal', value: '#111827' },
  { label: 'Black', value: '#000000' },
  { label: 'Slate Gray', value: '#475569' },
  { label: 'Word Blue', value: '#1c528a' },
  { label: 'Steel Blue', value: '#2563eb' },
  { label: 'Sky Blue', value: '#0284c7' },
  { label: 'Teal', value: '#0f766e' },
  { label: 'Emerald Green', value: '#16a34a' },
  { label: 'Lime Green', value: '#65a30d' },
  { label: 'Golden Yellow', value: '#ca8a04' },
  { label: 'Dark Orange', value: '#ea580c' },
  { label: 'Crimson Red', value: '#dc2626' },
  { label: 'Rose', value: '#e11d48' },
  { label: 'Violet', value: '#7c3aed' },
  { label: 'Purple', value: '#9333ea' },
  { label: 'Brown', value: '#92400e' },
];

const highlightOptions = [
  { label: 'Yellow Highlight', value: '#fef3c7' },
  { label: 'Green Highlight', value: '#dcfce7' },
  { label: 'Blue Highlight', value: '#dbeafe' },
  { label: 'Red Highlight', value: '#fee2e2' },
  { label: 'Purple Highlight', value: '#ede9fe' },
  { label: 'Orange Highlight', value: '#ffedd5' },
  { label: 'Gray Highlight', value: '#e5e7eb' },
];

const lineSpacingOptions = [
  { label: 'Single', value: '1' },
  { label: '1.15', value: '1.15' },
  { label: '1.25', value: '1.25' },
  { label: '1.5', value: '1.5' },
  { label: '1.75', value: '1.75' },
  { label: 'Double', value: '2' },
  { label: '2.5', value: '2.5' },
  { label: 'Triple', value: '3' },
];

const bulletStyleOptions = [
  { label: 'Default Bullet', value: 'disc', marker: '•', description: 'Standard filled bullet' },
  { label: 'Open Circle', value: 'circle', marker: '○', description: 'Hollow circular bullet' },
  { label: 'Square Bullet', value: 'square', marker: '■', description: 'Solid square bullet' },
  { label: 'Checkmark', value: 'check', marker: '✓', description: 'Checklist-style marker' },
  { label: 'Arrow', value: 'arrow', marker: '→', description: 'Directional marker' },
  { label: 'Star', value: 'star', marker: '★', description: 'Emphasis marker' },
  { label: 'Diamond', value: 'diamond', marker: '◆', description: 'Diamond marker' },
  { label: 'Triangle', value: 'triangle', marker: '▸', description: 'Triangle marker' },
  { label: 'Dash', value: 'dash', marker: '–', description: 'Dash marker' },
  { label: 'Plus', value: 'plus', marker: '+', description: 'Plus marker' },
  { label: 'No Bullets', value: 'none', marker: 'None', description: 'Remove list marker' },
];

const orderedListStyleOptions = [
  { label: '1, 2, 3', value: 'decimal' },
  { label: '01, 02, 03', value: 'decimal-leading-zero' },
  { label: 'a, b, c', value: 'lower-alpha' },
  { label: 'A, B, C', value: 'upper-alpha' },
  { label: 'i, ii, iii', value: 'lower-roman' },
  { label: 'I, II, III', value: 'upper-roman' },
  { label: 'Greek α, β, γ', value: 'lower-greek' },
];

const paragraphPresetOptions = [
  { label: 'Normal', value: 'normal' },
  { label: 'Large Lead', value: 'lead' },
  { label: 'Small Text', value: 'small' },
  { label: 'Caption', value: 'caption' },
];

const textTransformOptions = [
  { label: 'UPPERCASE', value: 'upper' },
  { label: 'lowercase', value: 'lower' },
  { label: 'Title Case', value: 'title' },
  { label: 'Sentence case', value: 'sentence' },
];

const symbolOptions = [
  { label: '±', value: '±' },
  { label: '∓', value: '∓' },
  { label: '×', value: '×' },
  { label: '÷', value: '÷' },
  { label: '≈', value: '≈' },
  { label: '≠', value: '≠' },
  { label: '≡', value: '≡' },
  { label: '≤', value: '≤' },
  { label: '≥', value: '≥' },
  { label: '<', value: '<' },
  { label: '>', value: '>' },
  { label: '∞', value: '∞' },
  { label: '∑', value: '∑' },
  { label: '∏', value: '∏' },
  { label: '∫', value: '∫' },
  { label: '∮', value: '∮' },
  { label: '∂', value: '∂' },
  { label: '∇', value: '∇' },
  { label: '√', value: '√' },
  { label: '∛', value: '∛' },
  { label: '∜', value: '∜' },
  { label: 'π', value: 'π' },
  { label: 'θ', value: 'θ' },
  { label: 'λ', value: 'λ' },
  { label: 'μ', value: 'μ' },
  { label: 'σ', value: 'σ' },
  { label: 'Ω', value: 'Ω' },
];

const equationSymbolOptions = [
  '±', '∓', '+', '−', '×', '÷', '=', '≠', '≈', '≡', '≅', '∝', '<', '>', '≤', '≥',
  '∞', '√', '∛', '∜', '∑', '∏', '∫', '∬', '∭', '∮', '∂', '∇', '∆', '∴', '∵',
  'π', 'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ρ',
  'σ', 'τ', 'φ', 'χ', 'ψ', 'ω', 'Γ', 'Δ', 'Θ', 'Λ', 'Ξ', 'Π', 'Σ', 'Φ', 'Ψ', 'Ω',
  '∈', '∉', '∋', '⊂', '⊃', '⊆', '⊇', '∪', '∩', '∅', '∀', '∃', '∄', '¬', '∧', '∨',
  '⇒', '⇔', '→', '←', '↔', '↦', '⊕', '⊗', '⊥', '∥', '∠', '△', '°', '′', '″',
  '²', '³', 'ⁿ', '₁', '₂', 'ₙ', '√()', '∛()', '⁄', '∑', '∫', 'lim', 'sin', 'cos', 'tan', 'log', 'ln',
  '()', '[]', '{}', '⁺', '⁻', '⁰', '¹', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '₀', '₃', '₄', '₅', '₆', '₇', '₈', '₉',
];

const smartArtCategories: SmartArtCategory[] = [
  'All',
  'List',
  'Process',
  'Cycle',
  'Hierarchy',
  'Relationship',
  'Matrix',
  'Pyramid',
  'Picture',
];

const smartArtTemplateOptions: {
  label: string;
  value: SmartArtTemplateType;
  category: Exclude<SmartArtCategory, 'All'>;
  description: string;
  usage: string;
}[] = [
  {
    label: 'Basic Block List',
    value: 'basicBlockList',
    category: 'List',
    description: 'Shows non-sequential or grouped blocks of information.',
    usage: 'Use this for feature lists, grouped notes, module summaries, and quick comparison blocks.',
  },
  {
    label: 'Vertical Bullet List',
    value: 'verticalBulletList',
    category: 'List',
    description: 'Shows stacked information blocks with short supporting text.',
    usage: 'Use this for step notes, checklist-style content, and policy or requirement summaries.',
  },
  {
    label: 'Picture List',
    value: 'pictureList',
    category: 'Picture',
    description: 'Combines editable image placeholders with related descriptions.',
    usage: 'Use this for image-based learning, screenshots, product examples, or visual lesson objects.',
  },
  {
    label: 'Basic Process',
    value: 'process',
    category: 'Process',
    description: 'Shows a left-to-right workflow or sequence.',
    usage: 'Use this for production flows, learning sequences, approval stages, and task workflows.',
  },
  {
    label: 'Chevron Process',
    value: 'chevronProcess',
    category: 'Process',
    description: 'Shows directional stages with strong progression.',
    usage: 'Use this when the user needs a clear process path from start to completion.',
  },
  {
    label: 'Basic Cycle',
    value: 'cycle',
    category: 'Cycle',
    description: 'Shows repeating or continuous stages.',
    usage: 'Use this for review loops, learning cycles, continuous improvement, and feedback cycles.',
  },
  {
    label: 'Organization Chart',
    value: 'hierarchy',
    category: 'Hierarchy',
    description: 'Shows parent-child structure or reporting levels.',
    usage: 'Use this for organization charts, course unit hierarchies, topic trees, and approval structures.',
  },
  {
    label: 'Relationship Diagram',
    value: 'relationship',
    category: 'Relationship',
    description: 'Shows how two or more items connect or influence each other.',
    usage: 'Use this for concept relationships, stakeholder links, dependencies, and cause-effect notes.',
  },
  {
    label: 'Matrix',
    value: 'matrix',
    category: 'Matrix',
    description: 'Shows relationships between two dimensions.',
    usage: 'Use this for decision matrices, SWOT-style comparisons, curriculum maps, and evaluation grids.',
  },
  {
    label: 'Basic Pyramid',
    value: 'pyramid',
    category: 'Pyramid',
    description: 'Shows layered or ranked information.',
    usage: 'Use this for priorities, foundations, Bloom levels, staged skill growth, and hierarchy of needs.',
  },
  {
    label: 'Picture Caption List',
    value: 'pictureCaptionList',
    category: 'Picture',
    description: 'Shows image placeholders with editable captions.',
    usage: 'Use this for screenshots, learner examples, portfolio items, or visual documentation.',
  },
];

const editableChartCategories: EditableChartCategory[] = [
  'All Charts',
  'Recent',
  'Templates',
  'Column',
  'Line',
  'Pie',
  'Bar',
  'Area',
  'X Y (Scatter)',
  'Map',
  'Stock',
  'Surface',
  'Radar',
  'Treemap',
  'Sunburst',
  'Histogram',
  'Box & Whisker',
  'Waterfall',
  'Funnel',
  'Combo',
];

const editableChartOptions: {
  label: string;
  value: EditableChartType;
  category: Exclude<EditableChartCategory, 'All Charts' | 'Recent' | 'Templates'>;
  description: string;
  usage: string;
}[] = [
  {
    label: 'Clustered Column',
    value: 'column',
    category: 'Column',
    description: 'Compares values across categories using vertical columns.',
    usage: 'Use this for unit scores, monthly totals, category comparison, or count-based reporting.',
  },
  {
    label: 'Stacked Column',
    value: 'stackedColumn',
    category: 'Column',
    description: 'Shows category totals split into multiple series.',
    usage: 'Use this when each category has parts, such as completed, pending, and delayed work.',
  },
  {
    label: 'Line',
    value: 'line',
    category: 'Line',
    description: 'Shows trends over time using connected data points.',
    usage: 'Use this for progress tracking, weekly results, growth patterns, or performance over time.',
  },
  {
    label: 'Pie',
    value: 'pie',
    category: 'Pie',
    description: 'Shows parts of a whole as percentage slices.',
    usage: 'Use this when total values add up to 100%, such as activity distribution or budget share.',
  },
  {
    label: 'Doughnut',
    value: 'doughnut',
    category: 'Pie',
    description: 'Shows parts of a whole with a center label.',
    usage: 'Use this for completion status, progress dashboards, or summarized percentage breakdowns.',
  },
  {
    label: 'Bar',
    value: 'bar',
    category: 'Bar',
    description: 'Compares values using horizontal bars.',
    usage: 'Use this when labels are long or when horizontal comparison is easier to scan.',
  },
  {
    label: 'Area',
    value: 'area',
    category: 'Area',
    description: 'Shows volume or cumulative movement across time.',
    usage: 'Use this for workload, enrollment, progress, or cumulative change across periods.',
  },
  {
    label: 'X Y Scatter',
    value: 'scatter',
    category: 'X Y (Scatter)',
    description: 'Shows the relationship between paired X and Y values.',
    usage: 'Use this for correlation, paired measurements, skill-vs-score mapping, or numeric analysis.',
  },
  {
    label: 'Map',
    value: 'map',
    category: 'Map',
    description: 'Shows values by location or region in editable table form.',
    usage: 'Use this for campus, region, market, or location-based distribution.',
  },
  {
    label: 'Stock',
    value: 'stock',
    category: 'Stock',
    description: 'Shows open, high, low, and close style values.',
    usage: 'Use this for finance-style changes, price ranges, or min/max daily measurements.',
  },
  {
    label: 'Surface',
    value: 'surface',
    category: 'Surface',
    description: 'Shows values across two dimensions as a grid.',
    usage: 'Use this for score surfaces, heatmap-like tables, or two-variable comparison.',
  },
  {
    label: 'Radar',
    value: 'radar',
    category: 'Radar',
    description: 'Compares multiple attributes around a common profile.',
    usage: 'Use this for skills, competencies, rubric dimensions, and learner profiles.',
  },
  {
    label: 'Treemap',
    value: 'treemap',
    category: 'Treemap',
    description: 'Shows hierarchical proportions by area.',
    usage: 'Use this for grouped contributions, content coverage, or topic weight distribution.',
  },
  {
    label: 'Sunburst',
    value: 'sunburst',
    category: 'Sunburst',
    description: 'Shows hierarchical data across levels.',
    usage: 'Use this for course, unit, lesson, and topic structures or taxonomy breakdowns.',
  },
  {
    label: 'Histogram',
    value: 'histogram',
    category: 'Histogram',
    description: 'Shows frequency distribution across ranges.',
    usage: 'Use this for score bands, time ranges, response counts, or distribution analysis.',
  },
  {
    label: 'Box & Whisker',
    value: 'boxWhisker',
    category: 'Box & Whisker',
    description: 'Summarizes minimum, quartile, median, and maximum values.',
    usage: 'Use this for assessment spread, performance distribution, and comparing variability.',
  },
  {
    label: 'Waterfall',
    value: 'waterfall',
    category: 'Waterfall',
    description: 'Shows how positive and negative changes build toward a final result.',
    usage: 'Use this for budget changes, score changes, progress deltas, or gap analysis.',
  },
  {
    label: 'Funnel',
    value: 'funnel',
    category: 'Funnel',
    description: 'Shows stage-by-stage reduction through a process.',
    usage: 'Use this for approval pipelines, enrollment flow, review stages, or conversion tracking.',
  },
  {
    label: 'Combo',
    value: 'combo',
    category: 'Combo',
    description: 'Combines quantity and target or rate values.',
    usage: 'Use this when the user needs both volume and percentage/target in one chart.',
  },
];

const nativeListStyleTypes = new Set([
  'disc',
  'circle',
  'square',
  'none',
  'decimal',
  'decimal-leading-zero',
  'lower-alpha',
  'upper-alpha',
  'lower-roman',
  'upper-roman',
  'lower-greek',
]);

const customBulletStyleMap: Record<string, string> = {
  check: '"✓ "',
  arrow: '"→ "',
  star: '"★ "',
  diamond: '"◆ "',
  triangle: '"▸ "',
  dash: '"– "',
  plus: '"+ "',
};

const academicTemplateOptions: {
  value: AcademicTemplateType;
  label: string;
}[] = [
  { value: 'course_overview', label: 'Course Overview' },
  { value: 'unit_plan', label: 'Unit Plan' },
  { value: 'lesson_plan', label: 'Lesson Plan' },
  { value: 'assessment_blueprint', label: 'Assessment Blueprint' },
  { value: 'rubric', label: 'Rubric' },
  { value: 'clo_table', label: 'CLO Table' },
  { value: 'weekly_plan', label: 'Weekly Plan' },
  { value: 'lab_record', label: 'Lab Record' },
  { value: 'reading_list', label: 'Reading List' },
  { value: 'approval_note', label: 'Approval Note' },
  { value: 'syllabus_unit_wise', label: 'Syllabus - Unit-wise' },
  { value: 'syllabus_module_wise', label: 'Syllabus - Module-wise' },
  { value: 'syllabus_chapter_wise', label: 'Syllabus - Chapter-wise' },
  { value: 'syllabus_topic_wise', label: 'Syllabus - Topic-wise' },
  { value: 'syllabus_custom', label: 'Syllabus - Custom' },
];

type SyllabusStructureType =
  | ''
  | 'unit_wise'
  | 'module_wise'
  | 'chapter_wise'
  | 'topic_wise'
  | 'custom';

type SyllabusSourceType =
  | ''
  | 'manual_entry'
  | 'upload_pdf'
  | 'upload_docx';

type SyllabusSectionPayload = {
  section_type: string;
  section_number: string;
  display_number: string;
  section_title: string;
  content_text: string;
  hours: string;
  section_order: number;
  parent_section_id: null;
  custom_fields_json: Record<string, unknown>;
};

function getTextValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function normalizeSyllabusStructureType(value: string): SyllabusStructureType {
  if (
    value === 'unit_wise' ||
    value === 'module_wise' ||
    value === 'chapter_wise' ||
    value === 'topic_wise' ||
    value === 'custom'
  ) {
    return value;
  }

  return '';
}

function normalizeSyllabusSourceType(value: string): SyllabusSourceType {
  if (
    value === 'manual_entry' ||
    value === 'upload_pdf' ||
    value === 'upload_docx'
  ) {
    return value;
  }

  return '';
}

function getSyllabusTemplateLabels(structureType: SyllabusStructureType) {
  switch (structureType) {
    case 'unit_wise':
      return {
        sectionType: 'unit',
        sectionLabel: 'Unit',
        numberLabel: 'Unit No.',
        titleLabel: 'Unit Title',
        contentLabel: 'Topics / Subtopics',
        hoursLabel: 'Hours',
        tableTitle: 'Unit-wise Syllabus',
      };

    case 'module_wise':
      return {
        sectionType: 'module',
        sectionLabel: 'Module',
        numberLabel: 'Module No.',
        titleLabel: 'Module Title',
        contentLabel: 'Topics / Subtopics',
        hoursLabel: 'Hours',
        tableTitle: 'Module-wise Syllabus',
      };

    case 'chapter_wise':
      return {
        sectionType: 'chapter',
        sectionLabel: 'Chapter',
        numberLabel: 'Chapter No.',
        titleLabel: 'Chapter Title',
        contentLabel: 'Topics / Subtopics',
        hoursLabel: 'Hours',
        tableTitle: 'Chapter-wise Syllabus',
      };

    case 'topic_wise':
      return {
        sectionType: 'topic',
        sectionLabel: 'Topic',
        numberLabel: 'Topic No.',
        titleLabel: 'Topic Title',
        contentLabel: 'Description / Subtopics',
        hoursLabel: 'Hours',
        tableTitle: 'Topic-wise Syllabus',
      };

    case 'custom':
    default:
      return {
        sectionType: 'section',
        sectionLabel: 'Section',
        numberLabel: 'Section No.',
        titleLabel: 'Section Title',
        contentLabel: 'Content / Subtopics',
        hoursLabel: 'Hours',
        tableTitle: 'Custom Syllabus',
      };
  }
}

function getAcademicTemplateFromSyllabusStructure(
  structureType: SyllabusStructureType
): AcademicTemplateType {
  switch (structureType) {
    case 'unit_wise':
      return 'syllabus_unit_wise';

    case 'module_wise':
      return 'syllabus_module_wise';

    case 'chapter_wise':
      return 'syllabus_chapter_wise';

    case 'topic_wise':
      return 'syllabus_topic_wise';

    case 'custom':
    default:
      return 'syllabus_custom';
  }
}

function getSyllabusStructureFromAcademicTemplate(
  templateType: AcademicTemplateType
): SyllabusStructureType {
  switch (templateType) {
    case 'syllabus_unit_wise':
      return 'unit_wise';

    case 'syllabus_module_wise':
      return 'module_wise';

    case 'syllabus_chapter_wise':
      return 'chapter_wise';

    case 'syllabus_topic_wise':
      return 'topic_wise';

    case 'syllabus_custom':
      return 'custom';

    default:
      return '';
  }
}

function buildSyllabusTemplateRows(
  structureType: SyllabusStructureType
): SyllabusSectionPayload[] {
  const labels = getSyllabusTemplateLabels(structureType || 'custom');

  const defaultRows = [
    {
      title: 'Foundational Concepts',
      content:
        'Enter introductory concepts, definitions, prerequisites, and overview topics.',
      hours: '0',
    },
    {
      title: 'Core Concepts',
      content:
        'Enter core syllabus topics, principles, methods, and important subtopics.',
      hours: '0',
    },
    {
      title: 'Applied Concepts',
      content:
        'Enter application-oriented topics, examples, practice areas, and use cases.',
      hours: '0',
    },
    {
      title: 'Advanced Topics',
      content:
        'Enter advanced topics, extensions, tools, frameworks, or deeper concepts.',
      hours: '0',
    },
    {
      title: 'Practice / Project / Revision',
      content:
        'Enter practice work, mini project, revision topics, or final learning activities.',
      hours: '0',
    },
  ];

  return defaultRows.map((row, index) => {
    const sectionNumber = String(index + 1);

    return {
      section_type: labels.sectionType,
      section_number: sectionNumber,
      display_number: `${labels.sectionLabel} ${sectionNumber}`,
      section_title: row.title,
      content_text: row.content,
      hours: row.hours,
      section_order: index + 1,
      parent_section_id: null,
      custom_fields_json: {},
    };
  });
}

function buildSyllabusDraftTableTemplate(
  structureType: SyllabusStructureType,
  context?: AiEditorContext,
  syllabusTitle?: string,
  syllabusVersion?: string
) {
  const normalizedStructureType = structureType || 'custom';
  const labels = getSyllabusTemplateLabels(normalizedStructureType);
  const rows = buildSyllabusTemplateRows(normalizedStructureType);
  const courseTitle = context?.courseTitle || '[Course Title]';
  const courseCode = context?.courseCode || '[Course Code]';
  const programmeName = context?.programmeName || '[Programme]';
  const semester = context?.semester || '[Semester]';

  const rowsHtml = rows
    .map((row) => {
      return `
        <tr data-syllabus-section-row="true">
          <td>${escapeHtml(row.display_number)}</td>
          <td>${escapeHtml(row.section_title)}</td>
          <td>${escapeHtml(row.content_text)}</td>
          <td>${escapeHtml(row.hours)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <h2>${escapeHtml(syllabusTitle || labels.tableTitle)}</h2>
    <p><strong>Syllabus Version:</strong> ${escapeHtml(syllabusVersion || 'v1.0')}</p>
    <p><strong>Course Title:</strong> ${escapeHtml(courseTitle)}</p>
    <p><strong>Course Code:</strong> ${escapeHtml(courseCode)}</p>
    <p><strong>Programme:</strong> ${escapeHtml(programmeName)}</p>
    <p><strong>Semester:</strong> ${escapeHtml(semester)}</p>

    <h3>${escapeHtml(labels.tableTitle)}</h3>

    <table data-syllabus-template-table="true" data-syllabus-structure-type="${escapeHtml(normalizedStructureType)}">
      <tbody>
        <tr>
          <th>${escapeHtml(labels.numberLabel)}</th>
          <th>${escapeHtml(labels.titleLabel)}</th>
          <th>${escapeHtml(labels.contentLabel)}</th>
          <th>${escapeHtml(labels.hoursLabel)}</th>
        </tr>
        ${rowsHtml}
      </tbody>
    </table>

    <p><strong>Instructions:</strong> Edit the table cells. Add or delete rows if required. Keep the same four columns so the syllabus can be saved correctly.</p>
  `;
}

function extractSyllabusSectionsFromHtml(
  html: string,
  structureType: SyllabusStructureType
): SyllabusSectionPayload[] {
  if (typeof window === 'undefined' || !html.trim()) {
    return [];
  }

  const labels = getSyllabusTemplateLabels(structureType || 'custom');
  const parser = new DOMParser();
  const documentValue = parser.parseFromString(html, 'text/html');
  const table =
    documentValue.querySelector('table[data-syllabus-template-table="true"]') ||
    documentValue.querySelector('table');

  if (!table) {
    return [];
  }

  const rows = Array.from(table.querySelectorAll('tr')).slice(1);

  return rows
    .map((row, index) => {
      const cells = Array.from(row.querySelectorAll('td, th')).map((cell) =>
        (cell.textContent || '').replace(/\s+/g, ' ').trim()
      );

      const displayNumber = cells[0] || `${labels.sectionLabel} ${index + 1}`;
      const sectionNumberMatch = displayNumber.match(/\d+(?:\.\d+)*/);

      return {
        section_type: labels.sectionType,
        section_number: sectionNumberMatch?.[0] || String(index + 1),
        display_number: displayNumber,
        section_title: cells[1] || '',
        content_text: cells[2] || '',
        hours: cells[3] || '',
        section_order: index + 1,
        parent_section_id: null,
        custom_fields_json: {},
      };
    })
    .filter((row) => {
      return (
        row.section_title.trim() ||
        row.content_text.trim() ||
        row.hours.trim()
      );
    });
}


const coverPageTemplateOptions: {
  value: CoverPageTemplateType;
  label: string;
  description: string;
}[] = [
  {
    value: 'academicReport',
    label: 'Academic Report',
    description: 'Formal report title page with institution, title, author, and date.',
  },
  {
    value: 'courseAssignment',
    label: 'Course Assignment',
    description: 'Assignment cover page with course, learner, instructor, and submission date.',
  },
  {
    value: 'projectReport',
    label: 'Project Report',
    description: 'Project submission cover page with project title, team, guide, and department.',
  },
  {
    value: 'trainingModule',
    label: 'Training Module',
    description: 'Learning-module cover page with module title, audience, and version.',
  },
  {
    value: 'minimalDocument',
    label: 'Minimal Document',
    description: 'Clean cover page with title, subtitle, and date.',
  },
];


const headerTemplateOptions: {
  value: HeaderTemplateType;
  label: string;
  description: string;
}[] = [
  {
    value: 'documentTitle',
    label: 'Professional Title Header',
    description: 'Document title on the left with organization and date on the right.',
  },
  {
    value: 'courseUnit',
    label: 'Course / Module Header',
    description: 'Course code, unit name, and academic term in a clean header line.',
  },
  {
    value: 'confidential',
    label: 'Confidential Business Header',
    description: 'Formal internal-use header with confidentiality emphasis.',
  },
  {
    value: 'draftReview',
    label: 'Draft Review Header',
    description: 'Review-status header with version and review date.',
  },
  {
    value: 'minimal',
    label: 'Minimal Professional Header',
    description: 'Simple centered header for clean business documents.',
  },
];

const footerTemplateOptions: {
  value: FooterTemplateType;
  label: string;
  description: string;
}[] = [
  {
    value: 'pageFooter',
    label: 'Professional Page Footer',
    description: 'Clean document footer with document control, date, and page reference.',
  },
  {
    value: 'preparedBy',
    label: 'Prepared / Reviewed Footer',
    description: 'Formal sign-off footer with prepared-by and reviewed-by fields.',
  },
  {
    value: 'confidentialFooter',
    label: 'Confidential Business Footer',
    description: 'Internal-use footer with confidentiality and distribution notice.',
  },
  {
    value: 'approvalFooter',
    label: 'Approval Footer',
    description: 'Professional approval footer with approver, status, and date.',
  },
  {
    value: 'minimalFooter',
    label: 'Minimal Professional Footer',
    description: 'Simple centered footer for clean business documents.',
  },
];

const signatureLineTemplateOptions: {
  value: SignatureLineTemplateType;
  label: string;
  description: string;
}[] = [
  {
    value: 'basicSignature',
    label: 'Basic Signature',
    description: 'Single signature line for simple document signing.',
  },
  {
    value: 'nameDateSignature',
    label: 'Name + Date Signature',
    description: 'Signature table with name, designation, and date.',
  },
  {
    value: 'approvalSignature',
    label: 'Prepared / Reviewed / Approved',
    description: 'Three-stage approval signature table.',
  },
  {
    value: 'facultyApprovalSignature',
    label: 'Faculty / Coordinator / HOD',
    description: 'Course-management approval signature table.',
  },
  {
    value: 'digitalSignature',
    label: 'Digital Signature',
    description: 'Digital signing block with signer email and timestamp.',
  },
  {
    value: 'initialsSignature',
    label: 'Initials / Short Approval',
    description: 'Compact initials line for quick verification.',
  },
];


const tableOfContentsOptions: {
  value: TableOfContentsPreset;
  label: string;
  description: string;
}[] = [
  {
    value: 'classicHeading',
    label: 'Classic Heading TOC',
    description: 'Standard editable heading-based table of contents.',
  },
  {
    value: 'numbered',
    label: 'Numbered TOC',
    description: 'Multi-level numbered contents using heading levels.',
  },
  {
    value: 'bullet',
    label: 'Bullet TOC',
    description: 'Simple bullet list generated from document headings.',
  },
  {
    value: 'expandable',
    label: 'Expandable TOC',
    description: 'Collapsible table of contents using editable details blocks.',
  },
  {
    value: 'stickySidebar',
    label: 'Sticky Sidebar TOC',
    description: 'Sidebar-style navigation block for long digital content.',
  },
  {
    value: 'interactiveHyperlinked',
    label: 'Interactive Hyperlinked TOC',
    description: 'Clickable links generated from headings.',
  },
  {
    value: 'treeView',
    label: 'Tree View TOC',
    description: 'Indented LMS/course-style tree structure.',
  },
  {
    value: 'mini',
    label: 'Mini TOC',
    description: 'Compact contents block using the first few headings.',
  },
  {
    value: 'pageNumber',
    label: 'Page Number TOC',
    description: 'Print/PDF-style contents with editable page placeholders.',
  },
  {
    value: 'custom',
    label: 'Custom TOC (H1-H6)',
    description: 'Choose which heading levels to include.',
  },
];


const defaultFootnoteSettings: FootnoteSettings = {
  numberFormat: 'decimal',
  footnoteLocation: 'bottom-of-page',
  endnoteLocation: 'end-of-document',
  restartRule: 'continuous',
};

const footnoteNumberFormatOptions: {
  value: FootnoteNumberFormat;
  label: string;
}[] = [
  { value: 'decimal', label: '1, 2, 3' },
  { value: 'lower-alpha', label: 'a, b, c' },
  { value: 'lower-roman', label: 'i, ii, iii' },
  { value: 'symbols', label: '*, †, ‡, §' },
];

const footnoteSymbolSequence = ['*', '†', '‡', '§', '‖', '¶'];

function formatFootnoteMarker(number: number, format: FootnoteNumberFormat) {
  if (format === 'lower-alpha') {
    const base = 'abcdefghijklmnopqrstuvwxyz';
    let value = number;
    let output = '';

    while (value > 0) {
      value -= 1;
      output = base[value % 26] + output;
      value = Math.floor(value / 26);
    }

    return output || 'a';
  }

  if (format === 'lower-roman') {
    const romanPairs: [number, string][] = [
      [1000, 'm'],
      [900, 'cm'],
      [500, 'd'],
      [400, 'cd'],
      [100, 'c'],
      [90, 'xc'],
      [50, 'l'],
      [40, 'xl'],
      [10, 'x'],
      [9, 'ix'],
      [5, 'v'],
      [4, 'iv'],
      [1, 'i'],
    ];

    let value = number;
    let output = '';

    romanPairs.forEach(([amount, marker]) => {
      while (value >= amount) {
        output += marker;
        value -= amount;
      }
    });

    return output || 'i';
  }

  if (format === 'symbols') {
    return footnoteSymbolSequence[(number - 1) % footnoteSymbolSequence.length];
  }

  return String(number);
}

const aiActionOptions: {
  action: AiEditorAction;
  label: string;
  icon: 'sparkles' | 'book' | 'graduation' | 'skills' | 'quiz' | 'language';
}[] = [
  { action: 'improve', label: 'Refine Academic Text', icon: 'sparkles' },
  { action: 'summarize', label: 'Generate Abstract', icon: 'book' },
  { action: 'generate_outcomes', label: 'Generate CLOs', icon: 'graduation' },
  { action: 'syllabus_to_units', label: 'Convert to Units', icon: 'book' },
  { action: 'map_skills', label: 'Map Skills', icon: 'skills' },
  { action: 'generate_quiz', label: 'Generate Quiz', icon: 'quiz' },
  { action: 'translate', label: 'Translate', icon: 'language' },
];

const tableToolsGridStyle: CSSProperties = {
  gridTemplateColumns: 'repeat(3, minmax(112px, 1fr))',
  gridAutoRows: '34px',
  gap: '8px',
};

const tableToolButtonStyle: CSSProperties = {
  width: '100%',
  minWidth: '112px',
  aspectRatio: 'auto',
  padding: '0 10px',
  fontSize: '11px',
  lineHeight: '15px',
  gap: '6px',
  justifyContent: 'center',
};


const namedControlsTabsCss = `
.${styles.toolbar}[data-ribbon-tab="design"],
.${styles.toolbar}[data-ribbon-tab="insert"],
.${styles.toolbar}[data-ribbon-tab="layout"],
.${styles.toolbar}[data-ribbon-tab="references"],
.${styles.toolbar}[data-ribbon-tab="mailings"],
.${styles.toolbar}[data-ribbon-tab="review"],
.${styles.toolbar}[data-ribbon-tab="view"],
.${styles.toolbar}[data-ribbon-tab="help"] {
  overflow-x: auto !important;
  overflow-y: visible !important;
  align-items: flex-start !important;
  align-content: flex-start !important;
}

.${styles.toolbar}[data-ribbon-tab="design"] .${styles.toolbarRow},
.${styles.toolbar}[data-ribbon-tab="insert"] .${styles.toolbarRow},
.${styles.toolbar}[data-ribbon-tab="layout"] .${styles.toolbarRow},
.${styles.toolbar}[data-ribbon-tab="references"] .${styles.toolbarRow},
.${styles.toolbar}[data-ribbon-tab="mailings"] .${styles.toolbarRow},
.${styles.toolbar}[data-ribbon-tab="review"] .${styles.toolbarRow},
.${styles.toolbar}[data-ribbon-tab="view"] .${styles.toolbarRow},
.${styles.toolbar}[data-ribbon-tab="help"] .${styles.toolbarRow} {
  width: auto !important;
  min-width: fit-content !important;
  max-width: 100% !important;
  height: auto !important;
  min-height: 96px !important;
}

.${styles.toolbar}[data-ribbon-tab="design"] .${styles.toolbarContent},
.${styles.toolbar}[data-ribbon-tab="insert"] .${styles.toolbarContent},
.${styles.toolbar}[data-ribbon-tab="layout"] .${styles.toolbarContent},
.${styles.toolbar}[data-ribbon-tab="references"] .${styles.toolbarContent},
.${styles.toolbar}[data-ribbon-tab="mailings"] .${styles.toolbarContent},
.${styles.toolbar}[data-ribbon-tab="review"] .${styles.toolbarContent},
.${styles.toolbar}[data-ribbon-tab="view"] .${styles.toolbarContent},
.${styles.toolbar}[data-ribbon-tab="help"] .${styles.toolbarContent} {
  width: auto !important;
  min-width: 0 !important;
  overflow: visible !important;
}

.${styles.toolbar}[data-ribbon-tab="design"] .${styles.toolbarGroup},
.${styles.toolbar}[data-ribbon-tab="insert"] .${styles.toolbarGroup},
.${styles.toolbar}[data-ribbon-tab="layout"] .${styles.toolbarGroup},
.${styles.toolbar}[data-ribbon-tab="references"] .${styles.toolbarGroup},
.${styles.toolbar}[data-ribbon-tab="mailings"] .${styles.toolbarGroup},
.${styles.toolbar}[data-ribbon-tab="review"] .${styles.toolbarGroup},
.${styles.toolbar}[data-ribbon-tab="view"] .${styles.toolbarGroup},
.${styles.toolbar}[data-ribbon-tab="help"] .${styles.toolbarGroup} {
  width: auto !important;
  max-width: none !important;
  min-width: 0 !important;
  display: flex !important;
  flex-flow: row wrap !important;
  align-items: center !important;
  align-content: flex-start !important;
  justify-content: flex-start !important;
  gap: 8px !important;
  overflow: visible !important;
}

.${styles.toolbar}[data-ribbon-tab="design"] button,
.${styles.toolbar}[data-ribbon-tab="insert"] button,
.${styles.toolbar}[data-ribbon-tab="layout"] button,
.${styles.toolbar}[data-ribbon-tab="references"] button,
.${styles.toolbar}[data-ribbon-tab="mailings"] button,
.${styles.toolbar}[data-ribbon-tab="review"] button,
.${styles.toolbar}[data-ribbon-tab="view"] button,
.${styles.toolbar}[data-ribbon-tab="help"] button {
  width: auto !important;
  min-width: max-content !important;
  max-width: none !important;
  aspect-ratio: auto !important;
  padding: 0 10px !important;
  gap: 6px !important;
  font-size: 11px !important;
  line-height: 15px !important;
  white-space: nowrap !important;
  overflow: visible !important;
}

.${styles.toolbar}[data-ribbon-tab="design"] button[title],
.${styles.toolbar}[data-ribbon-tab="insert"] button[title],
.${styles.toolbar}[data-ribbon-tab="layout"] button[title],
.${styles.toolbar}[data-ribbon-tab="references"] button[title],
.${styles.toolbar}[data-ribbon-tab="mailings"] button[title],
.${styles.toolbar}[data-ribbon-tab="review"] button[title],
.${styles.toolbar}[data-ribbon-tab="view"] button[title],
.${styles.toolbar}[data-ribbon-tab="help"] button[title] {
  font-size: 0 !important;
  line-height: 0 !important;
}

.${styles.toolbar}[data-ribbon-tab="design"] button[title]::after,
.${styles.toolbar}[data-ribbon-tab="insert"] button[title]::after,
.${styles.toolbar}[data-ribbon-tab="layout"] button[title]::after,
.${styles.toolbar}[data-ribbon-tab="references"] button[title]::after,
.${styles.toolbar}[data-ribbon-tab="mailings"] button[title]::after,
.${styles.toolbar}[data-ribbon-tab="review"] button[title]::after,
.${styles.toolbar}[data-ribbon-tab="view"] button[title]::after,
.${styles.toolbar}[data-ribbon-tab="help"] button[title]::after {
  content: attr(title);
  display: inline-block;
  color: currentColor;
  font-size: 11px;
  font-weight: 700;
  line-height: 15px;
  white-space: nowrap;
}

.${styles.toolbar}[data-ribbon-tab="design"] button svg,
.${styles.toolbar}[data-ribbon-tab="insert"] button svg,
.${styles.toolbar}[data-ribbon-tab="layout"] button svg,
.${styles.toolbar}[data-ribbon-tab="references"] button svg,
.${styles.toolbar}[data-ribbon-tab="mailings"] button svg,
.${styles.toolbar}[data-ribbon-tab="review"] button svg,
.${styles.toolbar}[data-ribbon-tab="view"] button svg,
.${styles.toolbar}[data-ribbon-tab="help"] button svg {
  width: 16px !important;
  height: 16px !important;
  min-width: 16px !important;
  min-height: 16px !important;
  flex: 0 0 16px !important;
}




/* Signature Line button: keep it centered and aligned with Page Number in the Insert ribbon. */
.${styles.toolbar}[data-ribbon-tab="insert"] button[title="Signature Line"] {
  width: auto !important;
  min-width: 132px !important;
  max-width: none !important;
  height: var(--control-size) !important;
  min-height: var(--control-size) !important;
  aspect-ratio: auto !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 7px !important;
  padding: 0 12px !important;
  color: var(--success) !important;
  font-size: 0 !important;
  line-height: 0 !important;
  white-space: nowrap !important;
  overflow: visible !important;
  text-overflow: clip !important;
  flex: 0 0 auto !important;
  vertical-align: middle !important;
}

.${styles.toolbar}[data-ribbon-tab="insert"] button[title="Signature Line"] svg {
  width: 16px !important;
  height: 16px !important;
  min-width: 16px !important;
  min-height: 16px !important;
  flex: 0 0 16px !important;
  display: block !important;
  margin: 0 !important;
  color: var(--success) !important;
}

.${styles.toolbar}[data-ribbon-tab="insert"] button[title="Signature Line"]::after {
  content: "Signature Line" !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  height: var(--control-size) !important;
  color: currentColor !important;
  font-size: 11px !important;
  font-weight: 850 !important;
  line-height: 15px !important;
  white-space: nowrap !important;
}
.${styles.toolbar}[data-ribbon-tab="insert"] .${styles.groupTable} {
  width: auto !important;
  min-width: fit-content !important;
  max-width: 100% !important;
}

.${styles.toolbar}[data-ribbon-tab="insert"] .${styles.groupTable} .${styles.toolbarGroup} {
  flex-wrap: nowrap !important;
}

.${styles.toolbar}[data-ribbon-tab="insert"] .${styles.groupTable} button {
  min-width: max-content !important;
}

.${styles.toolbar}[data-ribbon-tab="layout"] .${styles.groupTable},
.${styles.toolbar}[data-ribbon-tab="references"] .${styles.groupTable},
.${styles.toolbar}[data-ribbon-tab="help"] .${styles.groupTable} {
  width: auto !important;
  min-width: fit-content !important;
}

.${styles.toolbar}[data-ribbon-tab="layout"] .${styles.toolbarSelect},
.${styles.toolbar}[data-ribbon-tab="references"] .${styles.toolbarSelect},
.${styles.toolbar}[data-ribbon-tab="insert"] .${styles.toolbarSelect},
.${styles.toolbar}[data-ribbon-tab="review"] .${styles.toolbarSelect} {
  flex: 0 0 auto !important;
  width: auto !important;
  min-width: 128px !important;
}
`;


const homeOnlyControlsCss = `
/* -------------------------------------------------------------------------- */
/* HOME TAB ONLY: FONT LISTS, BULLET MENU, H1-H6, FIND/REPLACE ALIGNMENT       */
/* -------------------------------------------------------------------------- */

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleControl {
  position: relative;
  grid-column: 1 / 3 !important;
  grid-row: 2 !important;
  width: 100% !important;
  min-width: 0 !important;
  z-index: 120;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleTrigger {
  width: 100% !important;
  min-width: 0 !important;
  height: var(--control-size) !important;
  aspect-ratio: auto !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
  padding: 0 10px !important;
  border: 0 !important;
  border-radius: 12px !important;
  background: #dfe6e9 !important;
  color: var(--primary-dark) !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  line-height: 15px !important;
  white-space: nowrap !important;
  box-shadow: var(--shadow-raise-soft) !important;
  cursor: pointer !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleTrigger:hover {
  color: var(--secondary) !important;
  transform: translateY(1px) scale(0.99) !important;
  box-shadow: var(--shadow-inset) !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleTrigger svg {
  width: 15px !important;
  height: 15px !important;
  min-width: 15px !important;
  min-height: 15px !important;
  color: var(--primary) !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleTriggerText {
  flex: 1 1 auto;
  display: inline-block !important;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleCaret {
  flex: 0 0 auto;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 10px;
  line-height: 1;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletDropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 5000;
  width: 248px;
  max-height: 330px;
  padding: 8px;
  border: 1px solid rgba(148, 163, 184, 0.38);
  border-radius: 14px;
  background: #f8fafc;
  box-shadow:
    10px 10px 24px rgba(148, 163, 184, 0.46),
    -8px -8px 18px rgba(255, 255, 255, 0.9);
  overflow-y: auto;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletOption {
  width: 100% !important;
  min-width: 0 !important;
  height: auto !important;
  min-height: 38px !important;
  aspect-ratio: auto !important;
  display: grid !important;
  grid-template-columns: 30px minmax(0, 1fr) !important;
  grid-template-rows: auto auto !important;
  column-gap: 8px !important;
  row-gap: 1px !important;
  align-items: center !important;
  justify-items: start !important;
  margin: 0 0 4px !important;
  padding: 7px 9px !important;
  border: 0 !important;
  border-radius: 10px !important;
  background: transparent !important;
  color: #1f2937 !important;
  font-size: 11px !important;
  line-height: 14px !important;
  text-align: left !important;
  box-shadow: none !important;
  cursor: pointer !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletOption:hover,
.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletOptionActive {
  background: #dfe6e9 !important;
  color: var(--primary-dark) !important;
  box-shadow: var(--shadow-inset) !important;
  transform: none !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletMarker {
  grid-row: 1 / 3;
  width: 24px;
  height: 24px;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #ffffff;
  color: var(--primary-dark);
  font-size: 12px;
  font-weight: 900;
  box-shadow: var(--input-shadow);
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletLabel {
  display: block !important;
  color: inherit;
  font-size: 11px;
  font-weight: 850;
  line-height: 14px;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletDescription {
  display: block !important;
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 650;
  line-height: 13px;
}

/* H1-H6 style group */
.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupHeadings} {
  width: 236px !important;
  min-width: 236px !important;
  min-height: 118px !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupHeadings} .${styles.toolbarContent} {
  min-height: 70px !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupHeadings} .${styles.toolbarGroup} {
  width: 100% !important;
  min-width: 0 !important;
  display: grid !important;
  grid-template-columns: repeat(6, var(--control-size)) !important;
  grid-auto-rows: var(--control-size) !important;
  gap: var(--control-gap) !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupHeadings} .${styles.toolbarGroup} > button:nth-of-type(1) {
  grid-column: 1 / 2 !important;
  grid-row: 1 !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupHeadings} .${styles.toolbarGroup} > button:nth-of-type(2) {
  grid-column: 2 / 3 !important;
  grid-row: 1 !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupHeadings} .${styles.toolbarGroup} > button:nth-of-type(3) {
  grid-column: 3 / 4 !important;
  grid-row: 1 !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupHeadings} .${styles.toolbarGroup} > button:nth-of-type(4) {
  grid-column: 4 / 5 !important;
  grid-row: 1 !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupHeadings} .${styles.toolbarGroup} > button:nth-of-type(5) {
  grid-column: 5 / 6 !important;
  grid-row: 1 !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupHeadings} .${styles.toolbarGroup} > button:nth-of-type(6) {
  grid-column: 6 / 7 !important;
  grid-row: 1 !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupHeadings} .${styles.toolbarGroup} > select.${styles.toolbarSelect} {
  grid-column: 1 / -1 !important;
  grid-row: 2 !important;
  width: 100% !important;
}

/* Find / Replace: vertical compact stack */
.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} {
  width: 190px !important;
  min-width: 190px !important;
  min-height: 154px !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarContent} {
  min-height: 108px !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarGroup} {
  width: 100% !important;
  min-width: 0 !important;
  display: grid !important;
  grid-template-columns: 1fr !important;
  grid-template-rows: repeat(3, var(--control-size)) !important;
  gap: var(--control-gap) !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarInput} {
  width: 100% !important;
  min-width: 0 !important;
  grid-column: 1 !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} button {
  width: 100% !important;
  min-width: 0 !important;
  aspect-ratio: auto !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 7px !important;
  padding: 0 12px !important;
  color: #991b1b !important;
  font-size: 11px !important;
  font-weight: 850 !important;
  line-height: 15px !important;
  white-space: nowrap !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} button svg {
  width: 15px !important;
  height: 15px !important;
  min-width: 15px !important;
  min-height: 15px !important;
}

@media (max-width: 767px) {
  .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupHeadings} {
    width: 236px !important;
    min-width: 236px !important;
  }

  .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} {
    width: 190px !important;
    min-width: 190px !important;
  }
}


/* Higher-specificity override for the current left-category/top-ribbon layout. */
.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupHeadings} {
  width: 236px !important;
  min-width: 236px !important;
  min-height: 118px !important;
}

.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupHeadings} .${styles.toolbarContent} {
  min-height: 70px !important;
}

.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupHeadings} .${styles.toolbarGroup} {
  width: 100% !important;
  min-width: 0 !important;
  display: grid !important;
  grid-template-columns: repeat(6, var(--control-size)) !important;
  grid-auto-rows: var(--control-size) !important;
  gap: var(--control-gap) !important;
}

.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupHeadings} .${styles.toolbarGroup} > button:nth-of-type(1) {
  grid-column: 1 / 2 !important;
  grid-row: 1 !important;
}

.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupHeadings} .${styles.toolbarGroup} > button:nth-of-type(2) {
  grid-column: 2 / 3 !important;
  grid-row: 1 !important;
}

.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupHeadings} .${styles.toolbarGroup} > button:nth-of-type(3) {
  grid-column: 3 / 4 !important;
  grid-row: 1 !important;
}

.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupHeadings} .${styles.toolbarGroup} > button:nth-of-type(4) {
  grid-column: 4 / 5 !important;
  grid-row: 1 !important;
}

.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupHeadings} .${styles.toolbarGroup} > button:nth-of-type(5) {
  grid-column: 5 / 6 !important;
  grid-row: 1 !important;
}

.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupHeadings} .${styles.toolbarGroup} > button:nth-of-type(6) {
  grid-column: 6 / 7 !important;
  grid-row: 1 !important;
}

.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupHeadings} .${styles.toolbarGroup} > select.${styles.toolbarSelect} {
  grid-column: 1 / -1 !important;
  grid-row: 2 !important;
  width: 100% !important;
}

.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} {
  width: 190px !important;
  min-width: 190px !important;
  min-height: 154px !important;
}

.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarContent} {
  min-height: 108px !important;
}

.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarGroup} {
  width: 100% !important;
  min-width: 0 !important;
  display: grid !important;
  grid-template-columns: 1fr !important;
  grid-template-rows: repeat(3, var(--control-size)) !important;
  gap: var(--control-gap) !important;
}

.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarInput} {
  width: 100% !important;
  min-width: 0 !important;
  grid-column: 1 !important;
}

.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} button {
  width: 100% !important;
  min-width: 0 !important;
  aspect-ratio: auto !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 7px !important;
  padding: 0 12px !important;
  color: #991b1b !important;
  font-size: 11px !important;
  font-weight: 850 !important;
  line-height: 15px !important;
  white-space: nowrap !important;
}

.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleControl {
  grid-column: 1 / 3 !important;
  grid-row: 2 !important;
  width: 100% !important;
  min-width: 0 !important;
}
`;


const homeDropdownAndFindFixCss = `
/* -------------------------------------------------------------------------- */
/* HOME TAB ONLY: CLEAN BULLET DROPDOWN + FIND/REPLACE ROW FIX                 */
/* -------------------------------------------------------------------------- */

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleControl,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleControl {
  position: relative !important;
  grid-column: 1 / 3 !important;
  grid-row: 2 !important;
  width: 100% !important;
  min-width: 0 !important;
  z-index: 9000 !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleTrigger,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleTrigger {
  width: 100% !important;
  min-width: 0 !important;
  height: var(--control-size) !important;
  aspect-ratio: auto !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
  padding: 0 10px !important;
  border: 1px solid rgba(148, 163, 184, 0.42) !important;
  border-radius: 12px !important;
  background: #ffffff !important;
  color: var(--primary-dark) !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  line-height: 15px !important;
  white-space: nowrap !important;
  box-shadow: var(--input-shadow) !important;
  cursor: pointer !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleTrigger:hover,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleTrigger:hover,
.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleTrigger:focus,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleTrigger:focus {
  color: var(--primary-dark) !important;
  background: #ffffff !important;
  transform: none !important;
  outline: none !important;
  box-shadow:
    var(--input-shadow),
    0 0 0 3px rgba(16, 171, 124, 0.14) !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleTriggerText,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleTriggerText {
  flex: 1 1 auto !important;
  display: inline-block !important;
  overflow: hidden !important;
  text-align: left !important;
  text-overflow: ellipsis !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleCaret,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleCaret {
  flex: 0 0 auto !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: #475569 !important;
  font-size: 10px !important;
  line-height: 1 !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletDropdown,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeBulletDropdown {
  position: absolute !important;
  top: calc(100% + 8px) !important;
  left: 0 !important;
  z-index: 99999 !important;
  width: 312px !important;
  max-height: 286px !important;
  padding: 10px !important;
  border: 1px solid rgba(148, 163, 184, 0.36) !important;
  border-radius: 16px !important;
  background: #ffffff !important;
  box-shadow:
    10px 10px 22px rgba(148, 163, 184, 0.42),
    -8px -8px 18px rgba(255, 255, 255, 0.95) !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
  scrollbar-width: thin !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletDropdown::-webkit-scrollbar,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeBulletDropdown::-webkit-scrollbar {
  width: 7px !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletDropdown::-webkit-scrollbar-thumb,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeBulletDropdown::-webkit-scrollbar-thumb {
  border-radius: 999px !important;
  background: rgba(107, 114, 128, 0.30) !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletOption,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeBulletOption {
  width: 100% !important;
  min-width: 0 !important;
  height: 42px !important;
  min-height: 42px !important;
  aspect-ratio: auto !important;
  display: grid !important;
  grid-template-columns: 34px minmax(0, 1fr) !important;
  grid-template-rows: 1fr !important;
  column-gap: 10px !important;
  align-items: center !important;
  justify-items: start !important;
  margin: 0 0 6px !important;
  padding: 0 10px !important;
  border: 0 !important;
  border-radius: 12px !important;
  background: #ffffff !important;
  color: #0f766e !important;
  font-size: 12px !important;
  line-height: 16px !important;
  text-align: left !important;
  box-shadow: none !important;
  cursor: pointer !important;
  white-space: nowrap !important;
  overflow: hidden !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletOption:hover,
.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletOptionActive,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeBulletOption:hover,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeBulletOptionActive {
  background: #dfe6e9 !important;
  color: var(--primary-dark) !important;
  box-shadow: var(--shadow-inset) !important;
  transform: none !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletMarker,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeBulletMarker {
  width: 26px !important;
  height: 26px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 10px !important;
  background: #dfe6e9 !important;
  color: var(--primary-dark) !important;
  font-size: 13px !important;
  font-weight: 900 !important;
  box-shadow: var(--shadow-inset) !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletLabel,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeBulletLabel {
  display: block !important;
  max-width: 100% !important;
  color: inherit !important;
  font-size: 12px !important;
  font-weight: 850 !important;
  line-height: 16px !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletDescription,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeBulletDescription {
  display: none !important;
}

/* Find / Replace: one clean row. Find text -> Replace with -> Replace All. */
.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind},
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} {
  width: 458px !important;
  min-width: 458px !important;
  max-width: 458px !important;
  min-height: 82px !important;
  height: 82px !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarContent},
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarContent} {
  min-height: var(--control-size) !important;
  height: var(--control-size) !important;
  align-items: center !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarGroup},
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarGroup} {
  width: 100% !important;
  min-width: 0 !important;
  display: grid !important;
  grid-template-columns: 156px 156px 112px !important;
  grid-template-rows: var(--control-size) !important;
  align-items: center !important;
  justify-content: start !important;
  gap: 8px !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarInput},
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarInput} {
  width: 100% !important;
  min-width: 0 !important;
  height: var(--control-size) !important;
  grid-column: auto !important;
  grid-row: 1 !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} button,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} button {
  width: 112px !important;
  min-width: 112px !important;
  max-width: 112px !important;
  height: var(--control-size) !important;
  aspect-ratio: auto !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 7px !important;
  padding: 0 10px !important;
  color: #991b1b !important;
  font-size: 11px !important;
  font-weight: 850 !important;
  line-height: 15px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} button svg,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} button svg {
  width: 15px !important;
  height: 15px !important;
  min-width: 15px !important;
  min-height: 15px !important;
}

@media (max-width: 767px) {
  .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind},
  .${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} {
    width: 420px !important;
    min-width: 420px !important;
    max-width: 420px !important;
  }

  .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarGroup},
  .${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarGroup} {
    grid-template-columns: 140px 140px 108px !important;
  }
}
`;


const homeFinalNativeSelectFindCss = `
/* -------------------------------------------------------------------------- */
/* FINAL HOME ONLY: NATIVE BULLET SELECT + COMPACT FIND/REPLACE               */
/* -------------------------------------------------------------------------- */

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleSelect,
.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleSelect {
  grid-column: 1 / 3 !important;
  grid-row: 2 !important;
  width: 100% !important;
  min-width: 0 !important;
  height: var(--control-size) !important;
  min-height: var(--control-size) !important;
  border: 1px solid rgba(148, 163, 184, 0.42) !important;
  border-radius: 12px !important;
  padding: 0 26px 0 10px !important;
  background-color: #ffffff !important;
  color: var(--primary-dark) !important;
  font-family: inherit !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  line-height: 15px !important;
  box-shadow: var(--input-shadow) !important;
  cursor: pointer !important;
  appearance: none !important;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%230f766e' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>") !important;
  background-repeat: no-repeat !important;
  background-position: right 8px center !important;
  background-size: 11px !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleSelect:hover,
.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleSelect:focus,
.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleSelect:hover,
.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleSelect:focus {
  outline: none !important;
  color: var(--primary-dark) !important;
  background-color: #ffffff !important;
  transform: none !important;
  box-shadow:
    var(--input-shadow),
    0 0 0 3px rgba(16, 171, 124, 0.14) !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleSelect option,
.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .homeBulletStyleSelect option {
  background: #ffffff !important;
  color: #0f766e !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  padding: 8px 10px !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind},
.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} {
  width: 438px !important;
  min-width: 438px !important;
  max-width: 438px !important;
  min-height: 76px !important;
  height: 76px !important;
  padding: 10px 10px 8px !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarContent},
.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarContent} {
  width: 100% !important;
  min-height: var(--control-size) !important;
  height: var(--control-size) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  overflow: visible !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarGroup},
.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarGroup} {
  width: 100% !important;
  min-width: 0 !important;
  display: grid !important;
  grid-template-columns: 148px 148px 104px !important;
  grid-template-rows: var(--control-size) !important;
  align-items: center !important;
  justify-content: start !important;
  gap: 7px !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarInput},
.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarInput} {
  width: 100% !important;
  min-width: 0 !important;
  height: var(--control-size) !important;
  grid-column: auto !important;
  grid-row: 1 !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} button,
.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} button {
  width: 104px !important;
  min-width: 104px !important;
  max-width: 104px !important;
  height: var(--control-size) !important;
  min-height: var(--control-size) !important;
  aspect-ratio: auto !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  padding: 0 8px !important;
  color: #991b1b !important;
  font-size: 11px !important;
  font-weight: 850 !important;
  line-height: 15px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} button svg,
.${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} button svg {
  width: 14px !important;
  height: 14px !important;
  min-width: 14px !important;
  min-height: 14px !important;
}

@media (max-width: 767px) {
  .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind},
  .${styles.editorShell}:has(.verticalRibbonNav) .verticalRibbonPanel .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} {
    width: 438px !important;
    min-width: 438px !important;
  }
}
`;


const homeCustomNeumorphicDropdownCss = `
/* -------------------------------------------------------------------------- */
/* HOME TAB ONLY: CUSTOM NEUMORPHIC DROPDOWNS                                  */
/* -------------------------------------------------------------------------- */

.${styles.toolbar}[data-ribbon-tab="home"],
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] {
  overflow-x: auto !important;
  overflow-y: visible !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.toolbarRow},
.${styles.toolbar}[data-ribbon-tab="home"] .${styles.toolbarContent},
.${styles.toolbar}[data-ribbon-tab="home"] .${styles.toolbarGroup},
.${styles.toolbar}[data-ribbon-tab="home"] .${styles.fontMatrix},
.${styles.toolbar}[data-ribbon-tab="home"] .${styles.fontComboWrap},
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.toolbarRow},
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.toolbarContent},
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.toolbarGroup},
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.fontMatrix},
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.fontComboWrap} {
  overflow: visible !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdown,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdown {
  position: relative !important;
  width: 100% !important;
  min-width: 0 !important;
  z-index: 3000 !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownTrigger,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownTrigger {
  width: 100% !important;
  min-width: 0 !important;
  height: var(--control-size) !important;
  min-height: var(--control-size) !important;
  aspect-ratio: auto !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
  padding: 0 10px !important;
  border: 1px solid rgba(148, 163, 184, 0.34) !important;
  border-radius: 13px !important;
  background: #dfe6e9 !important;
  color: var(--primary-dark) !important;
  font-family: inherit !important;
  font-size: 11px !important;
  font-weight: 850 !important;
  line-height: 15px !important;
  white-space: nowrap !important;
  box-shadow:
    inset 2px 2px 4px rgba(143, 156, 164, 0.28),
    inset -2px -2px 4px rgba(255, 255, 255, 0.72),
    4px 4px 9px rgba(143, 156, 164, 0.30),
    -4px -4px 9px rgba(255, 255, 255, 0.78) !important;
  cursor: pointer !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownTrigger:hover,
.${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownTrigger:focus,
.${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownTrigger[aria-expanded="true"],
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownTrigger:hover,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownTrigger:focus,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownTrigger[aria-expanded="true"] {
  background: #dfe6e9 !important;
  color: var(--primary-dark) !important;
  outline: none !important;
  transform: none !important;
  box-shadow:
    inset 4px 4px 8px rgba(143, 156, 164, 0.44),
    inset -4px -4px 8px rgba(255, 255, 255, 0.88),
    0 0 0 3px rgba(16, 171, 124, 0.14) !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownValue,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownValue {
  flex: 1 1 auto !important;
  min-width: 0 !important;
  display: block !important;
  overflow: hidden !important;
  text-align: left !important;
  text-overflow: ellipsis !important;
  color: inherit !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownCaret,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownCaret {
  flex: 0 0 auto !important;
  width: 16px !important;
  height: 16px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: var(--primary) !important;
  font-size: 11px !important;
  line-height: 1 !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownMenu,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownMenu {
  position: absolute !important;
  top: calc(100% + 8px) !important;
  left: 0 !important;
  z-index: 99999 !important;
  width: 280px !important;
  max-height: 304px !important;
  padding: 10px !important;
  border: 1px solid rgba(148, 163, 184, 0.32) !important;
  border-radius: 18px !important;
  background: #dfe6e9 !important;
  box-shadow:
    14px 14px 28px rgba(143, 156, 164, 0.46),
    -12px -12px 24px rgba(255, 255, 255, 0.86),
    inset 1px 1px 2px rgba(255, 255, 255, 0.68) !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
  scrollbar-width: thin !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownMenu::-webkit-scrollbar,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownMenu::-webkit-scrollbar {
  width: 7px !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownMenu::-webkit-scrollbar-thumb,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownMenu::-webkit-scrollbar-thumb {
  border-radius: 999px !important;
  background: rgba(100, 116, 139, 0.42) !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeFontDropdownMenu,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeFontDropdownMenu {
  width: 312px !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeSizeDropdownMenu,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeSizeDropdownMenu {
  width: 120px !important;
  max-height: 268px !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeBulletDropdownMenu,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeBulletDropdownMenu {
  width: 286px !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeNumberDropdownMenu,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeNumberDropdownMenu {
  width: 226px !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownOption,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownOption {
  width: 100% !important;
  min-width: 0 !important;
  height: auto !important;
  min-height: 38px !important;
  aspect-ratio: auto !important;
  display: grid !important;
  grid-template-columns: 30px minmax(0, 1fr) !important;
  align-items: center !important;
  gap: 9px !important;
  margin: 0 0 6px !important;
  padding: 7px 9px !important;
  border: 0 !important;
  border-radius: 13px !important;
  background: #dfe6e9 !important;
  color: #0f766e !important;
  font-family: inherit !important;
  font-size: 12px !important;
  font-weight: 800 !important;
  line-height: 15px !important;
  text-align: left !important;
  box-shadow:
    4px 4px 9px rgba(143, 156, 164, 0.30),
    -4px -4px 9px rgba(255, 255, 255, 0.74) !important;
  cursor: pointer !important;
  white-space: normal !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownOption:hover,
.${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownOptionActive,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownOption:hover,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownOptionActive {
  background: #dfe6e9 !important;
  color: var(--primary-dark) !important;
  box-shadow:
    inset 4px 4px 8px rgba(143, 156, 164, 0.42),
    inset -4px -4px 8px rgba(255, 255, 255, 0.86) !important;
  transform: none !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownMarker,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownMarker {
  width: 24px !important;
  height: 24px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 9px !important;
  background: #dfe6e9 !important;
  color: var(--primary-dark) !important;
  font-size: 13px !important;
  font-weight: 950 !important;
  box-shadow:
    inset 3px 3px 6px rgba(143, 156, 164, 0.40),
    inset -3px -3px 6px rgba(255, 255, 255, 0.86) !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownText,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownText {
  min-width: 0 !important;
  display: grid !important;
  gap: 1px !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownLabel,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownLabel {
  display: block !important;
  color: inherit !important;
  font-size: 12px !important;
  font-weight: 850 !important;
  line-height: 15px !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownDescription,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownDescription {
  display: block !important;
  color: #64748b !important;
  font-size: 10px !important;
  font-weight: 700 !important;
  line-height: 13px !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownOptionNoMarker,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownOptionNoMarker {
  grid-template-columns: minmax(0, 1fr) !important;
}
`;


const homeDropdownPortalCss = `
/* -------------------------------------------------------------------------- */
/* HOME TAB ONLY: PORTALED DROPDOWN MENUS - PREVENTS RIBBON OVERLAP/CLIPPING   */
/* -------------------------------------------------------------------------- */
.homeNeoDropdownMenuPortal {
  position: fixed !important;
  z-index: 2147483647 !important;
  padding: 10px !important;
  border: 1px solid rgba(148, 163, 184, 0.32) !important;
  border-radius: 18px !important;
  background: #dfe6e9 !important;
  box-shadow:
    14px 14px 28px rgba(143, 156, 164, 0.46),
    -12px -12px 24px rgba(255, 255, 255, 0.86),
    inset 1px 1px 2px rgba(255, 255, 255, 0.68) !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
  scrollbar-width: thin !important;
  pointer-events: auto !important;
  overscroll-behavior: contain !important;
  -webkit-overflow-scrolling: touch !important;
  touch-action: pan-y !important;
  height: auto !important;
}

.homeNeoDropdownMenuPortal::-webkit-scrollbar {
  width: 7px !important;
}

.homeNeoDropdownMenuPortal::-webkit-scrollbar-thumb {
  border-radius: 999px !important;
  background: rgba(100, 116, 139, 0.42) !important;
}

.homeNeoDropdownMenuPortal .homeNeoDropdownOption {
  width: 100% !important;
  min-width: 0 !important;
  height: auto !important;
  min-height: 38px !important;
  aspect-ratio: auto !important;
  display: grid !important;
  grid-template-columns: 30px minmax(0, 1fr) !important;
  align-items: center !important;
  gap: 9px !important;
  margin: 0 0 6px !important;
  padding: 7px 9px !important;
  border: 0 !important;
  border-radius: 13px !important;
  background: #dfe6e9 !important;
  color: #0f766e !important;
  font-family: inherit !important;
  font-size: 12px !important;
  font-weight: 800 !important;
  line-height: 15px !important;
  text-align: left !important;
  box-shadow:
    4px 4px 9px rgba(143, 156, 164, 0.30),
    -4px -4px 9px rgba(255, 255, 255, 0.74) !important;
  cursor: pointer !important;
  white-space: normal !important;
}

.homeNeoDropdownMenuPortal .homeNeoDropdownOption:hover,
.homeNeoDropdownMenuPortal .homeNeoDropdownOptionActive {
  background: #dfe6e9 !important;
  color: var(--primary-dark, #0f766e) !important;
  box-shadow:
    inset 4px 4px 8px rgba(143, 156, 164, 0.42),
    inset -4px -4px 8px rgba(255, 255, 255, 0.86) !important;
  transform: none !important;
}

.homeNeoDropdownMenuPortal .homeNeoDropdownMarker {
  width: 24px !important;
  height: 24px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 9px !important;
  background: #dfe6e9 !important;
  color: var(--primary-dark, #0f766e) !important;
  font-size: 13px !important;
  font-weight: 950 !important;
  box-shadow:
    inset 3px 3px 6px rgba(143, 156, 164, 0.40),
    inset -3px -3px 6px rgba(255, 255, 255, 0.86) !important;
}

.homeNeoDropdownMenuPortal .homeNeoDropdownText {
  min-width: 0 !important;
  display: grid !important;
  gap: 1px !important;
}

.homeNeoDropdownMenuPortal .homeNeoDropdownLabel {
  display: block !important;
  color: inherit !important;
  font-size: 12px !important;
  font-weight: 850 !important;
  line-height: 15px !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.homeNeoDropdownMenuPortal .homeNeoDropdownDescription {
  display: block !important;
  color: #64748b !important;
  font-size: 10px !important;
  font-weight: 700 !important;
  line-height: 13px !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.homeNeoDropdownMenuPortal .homeNeoDropdownOptionNoMarker {
  grid-template-columns: minmax(0, 1fr) !important;
}

.homeNeoDropdownMenuPortal .homeNeoDropdownEmpty {
  min-height: 38px !important;
  display: flex !important;
  align-items: center !important;
  padding: 8px 10px !important;
  color: #64748b !important;
  font-family: "Segoe UI", system-ui, sans-serif !important;
  font-size: 11px !important;
  font-weight: 750 !important;
  line-height: 15px !important;
}


/* HOME DROPDOWN FINAL FIX: visible list labels + dropdowns used by text color,
   highlight, paragraph, spacing, bullet style, number style, and case. */
.homeNeoDropdownMenuPortal[data-home-dropdown-kind="textColor"],
.homeNeoDropdownMenuPortal[data-home-dropdown-kind="highlightColor"],
.homeNeoDropdownMenuPortal[data-home-dropdown-kind="paragraphPreset"],
.homeNeoDropdownMenuPortal[data-home-dropdown-kind="lineSpacing"],
.homeNeoDropdownMenuPortal[data-home-dropdown-kind="bulletStyle"],
.homeNeoDropdownMenuPortal[data-home-dropdown-kind="numberStyle"],
.homeNeoDropdownMenuPortal[data-home-dropdown-kind="textCase"] {
  padding: 7px !important;
  border-radius: 16px !important;
  background: #dfe6e9 !important;
}

.homeNeoDropdownMenuPortal .homeNeoDropdownColorSwatch {
  width: 24px !important;
  height: 24px !important;
  display: inline-flex !important;
  border: 1px solid rgba(15, 23, 42, 0.16) !important;
  border-radius: 8px !important;
  box-shadow:
    inset 2px 2px 4px rgba(0, 0, 0, 0.08),
    inset -2px -2px 4px rgba(255, 255, 255, 0.58) !important;
}

.homeNeoDropdown[data-home-dropdown-kind="textColor"],
.homeNeoDropdown[data-home-dropdown-kind="highlightColor"],
.homeNeoDropdown[data-home-dropdown-kind="paragraphPreset"],
.homeNeoDropdown[data-home-dropdown-kind="lineSpacing"],
.homeNeoDropdown[data-home-dropdown-kind="bulletStyle"],
.homeNeoDropdown[data-home-dropdown-kind="numberStyle"],
.homeNeoDropdown[data-home-dropdown-kind="textCase"] {
  width: 100% !important;
  min-width: 0 !important;
}

.homeNeoDropdown[data-home-dropdown-kind="bulletStyle"] .homeNeoDropdownTrigger,
.homeNeoDropdown[data-home-dropdown-kind="numberStyle"] .homeNeoDropdownTrigger,
.homeNeoDropdown[data-home-dropdown-kind="paragraphPreset"] .homeNeoDropdownTrigger,
.homeNeoDropdown[data-home-dropdown-kind="lineSpacing"] .homeNeoDropdownTrigger,
.homeNeoDropdown[data-home-dropdown-kind="textCase"] .homeNeoDropdownTrigger,
.homeNeoDropdown[data-home-dropdown-kind="textColor"] .homeNeoDropdownTrigger,
.homeNeoDropdown[data-home-dropdown-kind="highlightColor"] .homeNeoDropdownTrigger {
  width: 100% !important;
  min-width: 0 !important;
  font-size: 11px !important;
  line-height: 15px !important;
}

.homeNeoDropdown[data-home-dropdown-kind="bulletStyle"] .homeNeoDropdownValue,
.homeNeoDropdown[data-home-dropdown-kind="numberStyle"] .homeNeoDropdownValue,
.homeNeoDropdown[data-home-dropdown-kind="paragraphPreset"] .homeNeoDropdownValue,
.homeNeoDropdown[data-home-dropdown-kind="lineSpacing"] .homeNeoDropdownValue,
.homeNeoDropdown[data-home-dropdown-kind="textCase"] .homeNeoDropdownValue,
.homeNeoDropdown[data-home-dropdown-kind="textColor"] .homeNeoDropdownValue,
.homeNeoDropdown[data-home-dropdown-kind="highlightColor"] .homeNeoDropdownValue {
  display: inline-block !important;
  min-width: 0 !important;
  max-width: 100% !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  color: inherit !important;
}

`;


const homeDropdownHomeLayoutFinalCss = `
/* -------------------------------------------------------------------------- */
/* HOME TAB ONLY: FINAL CONTROL SIZING FOR CUSTOM DROPDOWNS                   */
/* -------------------------------------------------------------------------- */
.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures},
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} {
  width: 244px !important;
  min-width: 244px !important;
  max-width: 244px !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .${styles.toolbarGroup},
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .${styles.toolbarGroup} {
  grid-template-columns: repeat(4, 49px) !important;
  justify-content: start !important;
  column-gap: 7px !important;
  row-gap: 7px !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .homeBulletStyleControl,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .homeBulletStyleControl {
  grid-column: 1 / 3 !important;
  grid-row: 2 !important;
  width: 100% !important;
  min-width: 0 !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .homeNumberStyleControl,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .homeNumberStyleControl {
  grid-column: 3 / 5 !important;
  grid-row: 2 !important;
  width: 100% !important;
  min-width: 0 !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupParagraph} .homeParagraphDropdown,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupParagraph} .homeParagraphDropdown {
  grid-column: 1 / -1 !important;
  grid-row: 1 !important;
  width: 100% !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupParagraph} .homeSpacingDropdown,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupParagraph} .homeSpacingDropdown {
  grid-column: 1 / -1 !important;
  grid-row: 3 !important;
  width: 100% !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupHeadings} .homeCaseDropdown,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupHeadings} .homeCaseDropdown {
  grid-column: 1 / -1 !important;
  grid-row: 2 !important;
  width: 100% !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.fontMatrix} .homeTextColorDropdown,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.fontMatrix} .homeTextColorDropdown {
  grid-column: 1 / 3 !important;
  grid-row: 2 !important;
  width: 100% !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.fontMatrix} .homeHighlightDropdown,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.fontMatrix} .homeHighlightDropdown {
  grid-column: 5 / 8 !important;
  grid-row: 2 !important;
  width: 100% !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownTrigger,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownTrigger {
  width: 100% !important;
  min-width: 0 !important;
  height: var(--control-size) !important;
  min-height: var(--control-size) !important;
  aspect-ratio: auto !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 7px !important;
  padding: 0 10px !important;
  border: 1px solid rgba(148, 163, 184, 0.34) !important;
  border-radius: 13px !important;
  background: #dfe6e9 !important;
  color: var(--primary-dark) !important;
  font-family: inherit !important;
  font-size: 11px !important;
  font-weight: 850 !important;
  line-height: 15px !important;
  white-space: nowrap !important;
  box-shadow: var(--shadow-raise-soft) !important;
  cursor: pointer !important;
  overflow: hidden !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownValue,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownValue,
.${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownCaret,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownCaret {
  display: inline-flex !important;
  font-size: 11px !important;
  line-height: 15px !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownValue,
.${styles.editorShell}:has(.${styles.verticalRibbonNav}) .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .homeNeoDropdownValue {
  flex: 1 1 auto !important;
  min-width: 0 !important;
  overflow: hidden !important;
  text-align: left !important;
  text-overflow: ellipsis !important;
}
`;


const homeEditableScreenFinalFixCss = `
/* -------------------------------------------------------------------------- */
/* HOME FINAL: LIST CARD, FIND/REPLACE STACK, AND RIBBON SCROLL STABILITY      */
/* -------------------------------------------------------------------------- */
.${styles.verticalRibbonPanel} .${styles.toolbar},
.${styles.toolbar}[data-ribbon-tab="home"] {
  scroll-behavior: auto !important;
  overflow-anchor: none !important;
  overscroll-behavior-x: contain !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures},
.${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} {
  width: 246px !important;
  min-width: 246px !important;
  max-width: 246px !important;
  min-height: 146px !important;
  height: 146px !important;
  padding: 10px 10px 8px !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .${styles.toolbarContent},
.${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .${styles.toolbarContent} {
  width: 100% !important;
  min-height: 96px !important;
  height: 96px !important;
  align-items: flex-start !important;
  overflow: visible !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .${styles.toolbarGroup},
.${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .${styles.toolbarGroup} {
  width: 100% !important;
  min-width: 0 !important;
  display: grid !important;
  grid-template-columns: repeat(4, 44px) !important;
  grid-template-rows: repeat(3, var(--control-size)) !important;
  grid-auto-rows: var(--control-size) !important;
  column-gap: 8px !important;
  row-gap: 7px !important;
  align-items: center !important;
  justify-content: center !important;
  justify-items: center !important;
  overflow: visible !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .${styles.toolbarGroup} > button,
.${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .${styles.toolbarGroup} > button {
  width: var(--control-size) !important;
  min-width: var(--control-size) !important;
  max-width: var(--control-size) !important;
  height: var(--control-size) !important;
  min-height: var(--control-size) !important;
  padding: 0 !important;
  justify-self: center !important;
  align-self: center !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .${styles.toolbarGroup} > button:nth-of-type(1),
.${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .${styles.toolbarGroup} > button:nth-of-type(1) { grid-column: 1 / 2 !important; grid-row: 1 !important; }
.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .${styles.toolbarGroup} > button:nth-of-type(2),
.${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .${styles.toolbarGroup} > button:nth-of-type(2) { grid-column: 2 / 3 !important; grid-row: 1 !important; }
.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .${styles.toolbarGroup} > button:nth-of-type(3),
.${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .${styles.toolbarGroup} > button:nth-of-type(3) { grid-column: 3 / 4 !important; grid-row: 1 !important; }
.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .${styles.toolbarGroup} > button:nth-of-type(4),
.${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .${styles.toolbarGroup} > button:nth-of-type(4) { grid-column: 4 / 5 !important; grid-row: 1 !important; }

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .homeBulletStyleControl,
.${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .homeBulletStyleControl { grid-column: 1 / 3 !important; grid-row: 2 !important; width: 100% !important; min-width: 0 !important; align-self: center !important; }
.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .homeNumberStyleControl,
.${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .homeNumberStyleControl { grid-column: 3 / 5 !important; grid-row: 2 !important; width: 100% !important; min-width: 0 !important; align-self: center !important; }

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .${styles.toolbarGroup} > button:nth-of-type(5),
.${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .${styles.toolbarGroup} > button:nth-of-type(5) { grid-column: 2 / 3 !important; grid-row: 3 !important; }
.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .${styles.toolbarGroup} > button:nth-of-type(6),
.${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .${styles.toolbarGroup} > button:nth-of-type(6) { grid-column: 3 / 4 !important; grid-row: 3 !important; }

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .homeNeoDropdownTrigger,
.${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} .homeNeoDropdownTrigger { height: var(--control-size) !important; min-height: var(--control-size) !important; padding: 0 9px !important; justify-content: space-between !important; }

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind},
.${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} {
  width: 196px !important;
  min-width: 196px !important;
  max-width: 196px !important;
  min-height: 146px !important;
  height: 146px !important;
  padding: 10px 10px 8px !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarContent},
.${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarContent} {
  width: 100% !important;
  min-height: 96px !important;
  height: 96px !important;
  align-items: flex-start !important;
  overflow: visible !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarGroup},
.${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarGroup} {
  width: 100% !important;
  min-width: 0 !important;
  display: grid !important;
  grid-template-columns: 1fr !important;
  grid-template-rows: repeat(3, var(--control-size)) !important;
  grid-auto-rows: var(--control-size) !important;
  gap: 7px !important;
  align-items: center !important;
  justify-content: stretch !important;
  overflow: visible !important;
}

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarInput},
.${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} .${styles.toolbarInput} { width: 100% !important; min-width: 0 !important; max-width: none !important; height: var(--control-size) !important; min-height: var(--control-size) !important; grid-column: 1 !important; grid-row: auto !important; justify-self: stretch !important; }

.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} button,
.${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} button {
  width: 100% !important;
  min-width: 0 !important;
  max-width: none !important;
  height: var(--control-size) !important;
  min-height: var(--control-size) !important;
  aspect-ratio: auto !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 7px !important;
  padding: 0 11px !important;
  font-size: 11px !important;
  font-weight: 850 !important;
  line-height: 15px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  color: #991b1b !important;
}
.${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} button svg,
.${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} button svg { width: 15px !important; height: 15px !important; min-width: 15px !important; min-height: 15px !important; }

@media (max-width: 767px) {
  .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures},
  .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupStructures} { width: 246px !important; min-width: 246px !important; }
  .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind},
  .${styles.verticalRibbonPanel} .${styles.toolbar}[data-ribbon-tab="home"] .${styles.groupFind} { width: 196px !important; min-width: 196px !important; }
}
`;




const textBoxCalloutDisabledFinalCss = `
/* -------------------------------------------------------------------------- */
/* TEXT BOX CALLOUT FINAL: DISABLE AUTO RECTANGLE ON EDITOR CLICK              */
/* -------------------------------------------------------------------------- */
/* Keeps normal editor focus/caret behavior. Prevents empty text-box/callout
   utility rectangles from being visible when the editor receives first focus. */

.ProseMirror [data-type="textBoxCallout"]:empty,
.ProseMirror [data-node-type="textBoxCallout"]:empty,
.ProseMirror [data-document-utility-type="text-box"]:empty,
.ProseMirror [data-rendered-document-utility-type="text-box"]:empty,
.ProseMirror [data-rendered-quick-part-type="text-box"]:empty,
.ProseMirror [data-document-utility-type^="quick-part-"]:empty,
.ProseMirror [data-rendered-document-utility-type^="quick-part-"]:empty,
.ProseMirror [data-rendered-quick-part-type^="quick-part-"]:empty,
.previewContent [data-type="textBoxCallout"]:empty,
.previewContent [data-node-type="textBoxCallout"]:empty,
.previewContent [data-document-utility-type="text-box"]:empty,
.previewContent [data-rendered-document-utility-type="text-box"]:empty,
.previewContent [data-rendered-quick-part-type="text-box"]:empty,
.previewContent [data-document-utility-type^="quick-part-"]:empty,
.previewContent [data-rendered-document-utility-type^="quick-part-"]:empty,
.previewContent [data-rendered-quick-part-type^="quick-part-"]:empty {
  display: none !important;
  min-width: 0 !important;
  min-height: 0 !important;
  width: 0 !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  outline: none !important;
  pointer-events: none !important;
}

/* Collapse common empty rectangle shells without affecting typed paragraphs. */
.ProseMirror div[style*="background"]:empty,
.ProseMirror div[style*="border"]:empty,
.ProseMirror p[style*="background"]:empty,
.ProseMirror p[style*="border"]:empty,
.previewContent div[style*="background"]:empty,
.previewContent div[style*="border"]:empty,
.previewContent p[style*="background"]:empty,
.previewContent p[style*="border"]:empty {
  display: none !important;
  min-height: 0 !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}
`;




const lmsDesignTemplatesFinalCss = `
/* -------------------------------------------------------------------------- */
/* DESIGN TAB FINAL: LMS READY-MADE DOCUMENT TEMPLATES                         */
/* -------------------------------------------------------------------------- */
.${styles.toolbar}[data-ribbon-tab="design"] .lmsDesignTemplatesGroup {
  width: auto !important;
  min-width: 782px !important;
  max-width: none !important;
  min-height: 132px !important;
  height: auto !important;
}

.${styles.toolbar}[data-ribbon-tab="design"] .lmsDesignTemplatesGroup .${styles.toolbarContent} {
  min-height: 82px !important;
  height: auto !important;
  overflow: visible !important;
}

.${styles.toolbar}[data-ribbon-tab="design"] .lmsDesignTemplatesGroup .lmsDesignTemplatesGrid {
  width: auto !important;
  min-width: 760px !important;
  display: grid !important;
  grid-template-columns: repeat(7, minmax(96px, max-content)) !important;
  grid-auto-rows: var(--control-size) !important;
  gap: 8px !important;
  align-items: center !important;
  justify-content: start !important;
  overflow: visible !important;
}

.${styles.toolbar}[data-ribbon-tab="design"] .lmsDesignTemplatesGroup .lmsDesignTemplatesGrid > button {
  width: auto !important;
  min-width: 96px !important;
  max-width: none !important;
  height: var(--control-size) !important;
  min-height: var(--control-size) !important;
  aspect-ratio: auto !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 7px !important;
  padding: 0 12px !important;
  color: var(--primary-dark) !important;
  font-size: 11px !important;
  font-weight: 850 !important;
  line-height: 15px !important;
  white-space: nowrap !important;
  overflow: visible !important;
  text-overflow: clip !important;
}

.${styles.toolbar}[data-ribbon-tab="design"] .lmsDesignTemplatesGroup .lmsDesignTemplatesGrid > button::after {
  content: none !important;
}

.${styles.toolbar}[data-ribbon-tab="design"] .lmsDesignTemplatesGroup .lmsDesignTemplatesGrid > button > span,
.${styles.toolbar}[data-ribbon-tab="design"] .lmsDesignTemplatesGroup .lmsDesignTemplatesGrid > button > strong {
  display: inline !important;
}

.${styles.toolbar}[data-ribbon-tab="design"] .lmsDesignTemplatesGroup .lmsDesignTemplatesGrid > button svg {
  width: 15px !important;
  height: 15px !important;
  min-width: 15px !important;
  min-height: 15px !important;
  flex: 0 0 15px !important;
  color: var(--primary) !important;
}

.${styles.toolbar}[data-ribbon-tab="design"] .lmsDesignTemplatesGroup .${styles.toolbarLabel} {
  justify-content: center !important;
}

@media (max-width: 1024px) {
  .${styles.toolbar}[data-ribbon-tab="design"] .lmsDesignTemplatesGroup {
    min-width: 640px !important;
  }

  .${styles.toolbar}[data-ribbon-tab="design"] .lmsDesignTemplatesGroup .lmsDesignTemplatesGrid {
    min-width: 620px !important;
    grid-template-columns: repeat(5, minmax(96px, max-content)) !important;
  }
}

@media (max-width: 767px) {
  .${styles.toolbar}[data-ribbon-tab="design"] .lmsDesignTemplatesGroup {
    width: 100% !important;
    min-width: 100% !important;
  }

  .${styles.toolbar}[data-ribbon-tab="design"] .lmsDesignTemplatesGroup .lmsDesignTemplatesGrid {
    width: 100% !important;
    min-width: 0 !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }

  .${styles.toolbar}[data-ribbon-tab="design"] .lmsDesignTemplatesGroup .lmsDesignTemplatesGrid > button {
    min-width: 0 !important;
    width: 100% !important;
  }
}
`;


const layoutFunctionalFinalCss = `
/* -------------------------------------------------------------------------- */
/* LAYOUT TAB FINAL: FUNCTIONAL PAGE SETUP + ARRANGE BEHAVIOR                 */
/* -------------------------------------------------------------------------- */
.${styles.editorContent} {
  justify-content: center !important;
  align-items: flex-start !important;
  overflow: auto !important;
}

.${styles.editorContent} :global(.ProseMirror) {
  width: var(--layout-page-width) !important;
  max-width: var(--layout-page-width) !important;
  min-height: var(--layout-page-min-height) !important;
  flex: 0 0 var(--layout-page-width) !important;
  margin: 0 auto !important;
  padding: var(--layout-page-padding) !important;
  column-count: var(--layout-column-count) !important;
  column-gap: var(--layout-column-gap) !important;
  column-rule: var(--layout-column-rule) !important;
  hyphens: var(--layout-hyphenation) !important;
  transform: scale(var(--layout-zoom)) !important;
  transform-origin: top center !important;
  background-image: var(--layout-grid-background) !important;
  background-size: var(--layout-grid-size) !important;
}

.${styles.editorContent}[data-layout-view="compact"] :global(.ProseMirror) {
  box-shadow:
    0 6px 18px rgba(15, 23, 42, 0.08),
    inset 0 0 0 1px rgba(255, 255, 255, 0.72) !important;
}

.${styles.editorContent}[data-layout-columns="left"] :global(.ProseMirror) {
  column-count: 2 !important;
  column-gap: 42px !important;
}

.${styles.editorContent}[data-layout-columns="right"] :global(.ProseMirror) {
  column-count: 2 !important;
  column-gap: 42px !important;
}

.${styles.previewContent} {
  width: var(--layout-page-width) !important;
  max-width: var(--layout-page-width) !important;
  min-height: var(--layout-page-min-height) !important;
  margin: 22px auto !important;
  padding: var(--layout-page-padding) !important;
  column-count: var(--layout-column-count) !important;
  column-gap: var(--layout-column-gap) !important;
  column-rule: var(--layout-column-rule) !important;
  hyphens: var(--layout-hyphenation) !important;
  background-image: var(--layout-grid-background) !important;
  background-size: var(--layout-grid-size) !important;
}

.${styles.editorContent}[data-line-numbers="true"] :global(.ProseMirror),
.${styles.previewContent}[data-line-numbers="true"] {
  counter-reset: layout-line;
}

.${styles.editorContent}[data-line-numbers="true"] :global(.ProseMirror p),
.${styles.editorContent}[data-line-numbers="true"] :global(.ProseMirror li),
.${styles.previewContent}[data-line-numbers="true"] p,
.${styles.previewContent}[data-line-numbers="true"] li {
  counter-increment: layout-line;
  position: relative;
}

.${styles.editorContent}[data-line-numbers="true"] :global(.ProseMirror p::before),
.${styles.editorContent}[data-line-numbers="true"] :global(.ProseMirror li::before),
.${styles.previewContent}[data-line-numbers="true"] p::before,
.${styles.previewContent}[data-line-numbers="true"] li::before {
  content: counter(layout-line);
  position: absolute;
  left: -34px;
  min-width: 22px;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 700;
  text-align: right;
  user-select: none;
}

.${styles.editorContent} :global([data-layout-break="page"]),
.${styles.previewContent} [data-layout-break="page"] {
  break-before: page;
  page-break-before: always;
}

.${styles.editorContent} :global([data-layout-break="column"]),
.${styles.previewContent} [data-layout-break="column"] {
  break-before: column;
  column-break-before: always;
}

.layoutSelectionPane {
  margin: 0 0 12px auto;
  width: min(360px, 100%);
  border-radius: 16px;
  background: #dfe6e9;
  box-shadow: var(--shadow-raise-soft);
  padding: 10px;
}

.layoutSelectionPaneHeader {
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--secondary);
  font-size: 12px;
  font-weight: 900;
  border-bottom: 1px dashed rgba(107, 114, 128, 0.24);
  margin-bottom: 8px;
  padding-bottom: 6px;
}

.layoutSelectionPaneHeader button,
.layoutSelectionPaneBody button {
  border: 0;
  border-radius: 10px;
  background: #dfe6e9;
  color: var(--primary-dark);
  font-family: inherit;
  font-size: 11px;
  font-weight: 850;
  box-shadow: var(--shadow-raise-soft);
  cursor: pointer;
}

.layoutSelectionPaneHeader button {
  width: 28px;
  height: 28px;
}

.layoutSelectionPaneBody {
  display: grid;
  gap: 8px;
}

.layoutSelectionPaneBody button {
  min-height: 32px;
  text-align: left;
  padding: 0 10px;
}

.layoutSelectionPaneBody p {
  margin: 2px 0 0;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 650;
  line-height: 16px;
}

.${styles.toolbar}[data-ribbon-tab="layout"] button.${styles.activeButton},
.${styles.toolbar}[data-ribbon-tab="layout"] .${styles.activeButton} {
  color: var(--primary-dark) !important;
  box-shadow: var(--shadow-inset) !important;
}

@media (max-width: 1024px) {
  .${styles.editorContent} :global(.ProseMirror),
  .${styles.previewContent} {
    max-width: 100% !important;
    flex-basis: min(var(--layout-page-width), 100%) !important;
  }
}
`;


const referencesTocDropdownFinalCss = `
/* -------------------------------------------------------------------------- */
/* REFERENCES TAB FINAL: TABLE OF CONTENTS DROPDOWN                            */
/* -------------------------------------------------------------------------- */
.${styles.toolbar}[data-ribbon-tab="references"] .referencesTocGroup {
  width: 462px !important;
  min-width: 462px !important;
  max-width: 462px !important;
  min-height: 96px !important;
}

.${styles.toolbar}[data-ribbon-tab="references"] .referencesTocGroup .${styles.toolbarContent} {
  min-height: var(--control-size) !important;
  height: var(--control-size) !important;
}

.${styles.toolbar}[data-ribbon-tab="references"] .referencesTocControls {
  width: 100% !important;
  min-width: 0 !important;
  display: grid !important;
  grid-template-columns: minmax(196px, 1fr) 112px 118px !important;
  grid-template-rows: var(--control-size) !important;
  gap: 8px !important;
  align-items: center !important;
}

.${styles.toolbar}[data-ribbon-tab="references"] .referencesTocControls .${styles.toolbarSelect} {
  width: 100% !important;
  min-width: 0 !important;
  height: var(--control-size) !important;
  background-color: #ffffff !important;
  color: var(--secondary) !important;
  font-weight: 850 !important;
  box-shadow: var(--input-shadow) !important;
}

.${styles.toolbar}[data-ribbon-tab="references"] .referencesTocControls button,
.${styles.toolbar}[data-ribbon-tab="references"] .referencesTocControls button[title] {
  width: 100% !important;
  min-width: 0 !important;
  height: var(--control-size) !important;
  min-height: var(--control-size) !important;
  aspect-ratio: auto !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 7px !important;
  padding: 0 10px !important;
  color: var(--primary-dark) !important;
  font-size: 11px !important;
  font-weight: 850 !important;
  line-height: 15px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.${styles.toolbar}[data-ribbon-tab="references"] .referencesTocControls button::after {
  content: none !important;
}

.${styles.toolbar}[data-ribbon-tab="references"] .referencesTocControls button > span,
.${styles.toolbar}[data-ribbon-tab="references"] .referencesTocControls button > strong {
  display: inline !important;
}

@media (max-width: 767px) {
  .${styles.toolbar}[data-ribbon-tab="references"] .referencesTocGroup {
    width: 100% !important;
    min-width: 100% !important;
    max-width: 100% !important;
  }

  .${styles.toolbar}[data-ribbon-tab="references"] .referencesTocControls {
    grid-template-columns: 1fr !important;
    grid-template-rows: repeat(3, var(--control-size)) !important;
  }
}
`;

const footnotesFunctionalFinalCss = `
/* -------------------------------------------------------------------------- */
/* REFERENCES TAB FINAL: FOOTNOTES AND ENDNOTES                                */
/* -------------------------------------------------------------------------- */
.${styles.toolbar}[data-ribbon-tab="references"] .referencesFootnotesGroup {
  width: 510px !important;
  min-width: 510px !important;
  max-width: 510px !important;
  min-height: 96px !important;
}

.${styles.toolbar}[data-ribbon-tab="references"] .referencesFootnotesGroup .${styles.toolbarContent} {
  min-height: var(--control-size) !important;
  height: var(--control-size) !important;
}

.${styles.toolbar}[data-ribbon-tab="references"] .referencesFootnotesControls {
  width: 100% !important;
  min-width: 0 !important;
  display: flex !important;
  flex-flow: row nowrap !important;
  align-items: center !important;
  justify-content: flex-start !important;
  gap: 8px !important;
}

.${styles.toolbar}[data-ribbon-tab="references"] .referencesFootnotesControls button,
.${styles.toolbar}[data-ribbon-tab="references"] .referencesFootnotesControls button[title] {
  width: auto !important;
  min-width: max-content !important;
  max-width: none !important;
  height: var(--control-size) !important;
  min-height: var(--control-size) !important;
  aspect-ratio: auto !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 7px !important;
  padding: 0 10px !important;
  color: #174f84 !important;
  font-size: 11px !important;
  font-weight: 850 !important;
  line-height: 15px !important;
  white-space: nowrap !important;
}

.${styles.toolbar}[data-ribbon-tab="references"] .referencesFootnotesControls button::after {
  content: none !important;
}

.${styles.toolbar}[data-ribbon-tab="references"] .referencesFootnotesControls button > span,
.${styles.toolbar}[data-ribbon-tab="references"] .referencesFootnotesControls button > strong {
  display: inline !important;
}

.${styles.editorContent} .ProseMirror .editor-note-ref,
.${styles.previewContent} .editor-note-ref {
  color: #174f84;
  font-size: 0.72em;
  font-weight: 800;
  vertical-align: super;
  cursor: pointer;
}

.${styles.editorContent} .ProseMirror .editor-note-ref-active,
.${styles.previewContent} .editor-note-ref-active {
  border-radius: 4px;
  background: rgba(29, 78, 216, 0.14);
  outline: 2px solid rgba(29, 78, 216, 0.22);
}

.${styles.editorContent} .ProseMirror .editor-note-block,
.${styles.previewContent} .editor-note-block {
  margin: 28px 0 0;
  padding: 0;
  color: #111827;
  font-size: 12px;
  line-height: 18px;
  background: transparent;
}

.${styles.editorContent} .ProseMirror .editor-note-block hr,
.${styles.previewContent} .editor-note-block hr {
  width: 34%;
  margin: 0 0 8px;
  border: 0;
  border-top: 1px solid rgba(42, 53, 79, 0.36);
}

.${styles.editorContent} .ProseMirror .editor-note-item,
.${styles.previewContent} .editor-note-item {
  margin: 0 0 6px;
  padding: 0;
  font-size: 12px;
  line-height: 18px;
}

.${styles.editorContent} .ProseMirror .editor-note-item sup,
.${styles.previewContent} .editor-note-item sup {
  margin-right: 5px;
  color: #174f84;
  font-weight: 800;
}

.footnoteNotesPane,
.footnoteDialog {
  border: 1px solid rgba(148, 163, 184, 0.38);
  border-radius: 16px;
  background: #dfe6e9;
  box-shadow: var(--shadow-raise);
}

.footnoteNotesPane {
  margin: 0 0 12px;
  padding: 12px;
}

.footnoteNotesPaneHeader,
.footnoteDialogHeader {
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--dark-base);
  font-size: 13px;
  font-weight: 850;
}

.footnoteNotesPaneHeader button,
.footnoteDialogHeader button {
  width: 30px;
  min-width: 30px;
  height: 30px;
  border: 0;
  border-radius: 10px;
  background: #dfe6e9;
  color: var(--danger);
  font-size: 18px;
  font-weight: 900;
  line-height: 1;
  cursor: pointer;
  box-shadow: var(--shadow-raise-soft);
}

.footnoteNotesPaneBody {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}

.footnoteNotesPaneBody p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 18px;
}

.footnoteNotesPaneBody button {
  width: 100%;
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  border: 0;
  border-radius: 12px;
  padding: 10px 12px;
  background: #dfe6e9;
  color: var(--dark-base);
  text-align: left;
  cursor: pointer;
  box-shadow: var(--shadow-raise-soft);
}

.footnoteNotesPaneBody button:hover,
.footnoteNotesPaneBody .footnoteNoteActive {
  color: var(--secondary);
  box-shadow: var(--shadow-inset);
}

.footnoteNotesPaneBody button span {
  color: var(--secondary);
  font-size: 12px;
  font-weight: 850;
}

.footnoteNotesPaneBody button strong {
  color: inherit;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
}

.footnoteDialogOverlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.28);
}

.footnoteDialog {
  width: min(680px, 100%);
  padding: 18px;
}

.footnoteDialogGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 14px;
}

.footnoteDialogGrid label {
  display: grid;
  gap: 6px;
  color: var(--dark-base);
  font-size: 12px;
  font-weight: 800;
}

.footnoteDialogGrid select {
  min-height: 36px;
  border: 1px solid rgba(148, 163, 184, 0.42);
  border-radius: 12px;
  padding: 0 10px;
  outline: none;
  background: #ffffff;
  color: #111827;
  font: inherit;
  font-size: 12px;
  box-shadow: var(--input-shadow);
}

.footnoteDialogActions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.footnoteDialogActions button {
  min-height: 34px;
  border: 0;
  border-radius: 12px;
  padding: 0 14px;
  background: #dfe6e9;
  color: var(--secondary);
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: var(--shadow-raise-soft);
}

.footnoteDialogActions button:hover {
  color: var(--primary-dark);
  box-shadow: var(--shadow-inset);
}

@media (max-width: 767px) {
  .${styles.toolbar}[data-ribbon-tab="references"] .referencesFootnotesGroup {
    width: 100% !important;
    min-width: max-content !important;
  }

  .footnoteDialogGrid {
    grid-template-columns: 1fr;
  }

  .footnoteNotesPaneBody button {
    grid-template-columns: 1fr;
  }
}
`;

const equationCasualInlineFinalCss = `
/* -------------------------------------------------------------------------- */
/* EQUATION FINAL: CASUAL INLINE TEXT STYLE                                    */
/* -------------------------------------------------------------------------- */
/* Keeps equation editable, but removes the large card/frame look after insert. */
[data-equation-node-view="true"],
[data-editor-equation="true"],
.editorEquationShell,
.editorEquationBlock,
.mathNodeView,
.equationNodeView {
  display: inline-flex !important;
  align-items: baseline !important;
  justify-content: flex-start !important;
  width: auto !important;
  max-width: 100% !important;
  min-width: 0 !important;
  min-height: 0 !important;
  margin: 0 2px !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  vertical-align: baseline !important;
}

[data-equation-node-view="true"] .katex,
[data-editor-equation="true"] .katex,
.editorEquationShell .katex,
.editorEquationBlock .katex,
.mathNodeView .katex,
.equationNodeView .katex {
  font-size: 1.05em !important;
  line-height: 1.35 !important;
}

[data-equation-node-view="true"] .katex-display,
[data-editor-equation="true"] .katex-display,
.editorEquationShell .katex-display,
.editorEquationBlock .katex-display,
.mathNodeView .katex-display,
.equationNodeView .katex-display {
  display: inline-block !important;
  margin: 0 !important;
  text-align: inherit !important;
}

[data-equation-node-view="true"] [data-equation-label],
[data-editor-equation="true"] [data-equation-label],
.editorEquationShell [data-equation-label],
.editorEquationBlock [data-equation-label],
.mathNodeView [data-equation-label],
.equationNodeView [data-equation-label],
[data-equation-node-view="true"] .equationLabel,
[data-editor-equation="true"] .equationLabel,
.editorEquationShell .equationLabel,
.editorEquationBlock .equationLabel {
  display: none !important;
}

[data-equation-node-view="true"] .equationActions,
[data-editor-equation="true"] .equationActions,
.editorEquationShell .equationActions,
.editorEquationBlock .equationActions,
.mathNodeView .equationActions,
.equationNodeView .equationActions {
  opacity: 0 !important;
  pointer-events: none !important;
  position: absolute !important;
  right: -2px !important;
  top: -30px !important;
  z-index: 50 !important;
  display: inline-flex !important;
  gap: 6px !important;
  transition: opacity 0.15s ease !important;
}

[data-equation-node-view="true"]:hover .equationActions,
[data-editor-equation="true"]:hover .equationActions,
.editorEquationShell:hover .equationActions,
.editorEquationBlock:hover .equationActions,
.mathNodeView:hover .equationActions,
.equationNodeView:hover .equationActions {
  opacity: 1 !important;
  pointer-events: auto !important;
}

[data-equation-node-view="true"] button,
[data-editor-equation="true"] button,
.editorEquationShell button,
.editorEquationBlock button,
.mathNodeView button,
.equationNodeView button {
  min-width: auto !important;
  width: auto !important;
  height: 26px !important;
  min-height: 26px !important;
  padding: 0 9px !important;
  border: 0 !important;
  border-radius: 9px !important;
  background: #dfe6e9 !important;
  font-size: 10px !important;
  font-weight: 850 !important;
  line-height: 14px !important;
  box-shadow:
    3px 3px 7px rgba(143, 156, 164, 0.30),
    -3px -3px 7px rgba(255, 255, 255, 0.78) !important;
}

.ProseMirror [data-equation-node-view="true"],
.ProseMirror [data-editor-equation="true"],
.ProseMirror .editorEquationShell,
.ProseMirror .editorEquationBlock,
.ProseMirror .mathNodeView,
.ProseMirror .equationNodeView {
  position: relative !important;
}
`;


const equationNoToolbarNoGreenCardFinalCss = `
/* -------------------------------------------------------------------------- */
/* EQUATION FINAL: NO INLINE EDIT/DELETE BUTTONS + NO GREEN EMPTY CARD         */
/* -------------------------------------------------------------------------- */
/* The inserted equation now behaves like normal text. Edit/Delete buttons are
   removed from the editor surface. Use the Insert Equation dialog/toolbar for
   equation entry; no extra green block appears after clicking the editor. */

[data-editor-equation="true"] [data-equation-node-control="true"],
[data-equation-node-view="true"] [data-equation-node-control="true"],
.equationNodeToolbar,
.equationActions,
[data-equation-actions] {
  display: none !important;
  visibility: hidden !important;
  pointer-events: none !important;
}

[data-editor-equation="true"],
[data-equation-node-view="true"],
.editorEquationShell,
.editorEquationBlock,
.mathNodeView,
.equationNodeView {
  display: inline !important;
  width: auto !important;
  min-width: 0 !important;
  max-width: none !important;
  min-height: 0 !important;
  height: auto !important;
  margin: 0 2px !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  vertical-align: baseline !important;
  outline: none !important;
}

[data-editor-equation="true"] *,
[data-equation-node-view="true"] *,
.editorEquationShell *,
.editorEquationBlock *,
.mathNodeView *,
.equationNodeView * {
  box-shadow: none !important;
}

[data-editor-equation="true"] .katex,
[data-equation-node-view="true"] .katex,
.editorEquationShell .katex,
.editorEquationBlock .katex,
.mathNodeView .katex,
.equationNodeView .katex {
  font-size: 1em !important;
  line-height: inherit !important;
}

[data-editor-equation="true"] .katex-display,
[data-equation-node-view="true"] .katex-display,
.editorEquationShell .katex-display,
.editorEquationBlock .katex-display,
.mathNodeView .katex-display,
.equationNodeView .katex-display {
  display: inline !important;
  margin: 0 !important;
  text-align: inherit !important;
}

/* Remove the green empty box/card that appears as a leftover quick-part/text-box
   after clicking near the inserted equation. This targets only empty utility
   blocks, not normal text boxes with real content. */
.ProseMirror [data-document-utility-type^="quick-part-"]:empty,
.ProseMirror [data-document-utility-type="text-box"]:empty,
.ProseMirror [data-rendered-document-utility-type^="quick-part-"]:empty,
.ProseMirror [data-rendered-document-utility-type="text-box"]:empty,
.ProseMirror [data-rendered-quick-part-type^="quick-part-"]:empty,
.previewContent [data-document-utility-type^="quick-part-"]:empty,
.previewContent [data-document-utility-type="text-box"]:empty,
.previewContent [data-rendered-document-utility-type^="quick-part-"]:empty,
.previewContent [data-rendered-document-utility-type="text-box"]:empty,
.previewContent [data-rendered-quick-part-type^="quick-part-"]:empty {
  display: none !important;
  min-height: 0 !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

/* If the leftover green card is created as an empty paragraph/div with inline
   background/border but no actual text, collapse it without affecting typed text. */
.ProseMirror div[style*="background"]:empty,
.ProseMirror p[style*="background"]:empty,
.previewContent div[style*="background"]:empty,
.previewContent p[style*="background"]:empty {
  display: none !important;
  min-height: 0 !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}
`;


const equationAsEditableTextFinalCss = `
/* -------------------------------------------------------------------------- */
/* EQUATION FINAL: INSERT AS NORMAL EDITABLE TEXT                              */
/* -------------------------------------------------------------------------- */
/* Equations are inserted as regular ProseMirror text. This removes all visual
   equation-card UI and any leftover empty green quick-part card. */

[data-equation-node-view="true"],
[data-editor-equation="true"],
[data-type="math"],
[data-type="mathematics"],
.editorEquationShell,
.editorEquationBlock,
.mathNodeView,
.equationNodeView,
.tiptap-mathematics-render,
.tiptap-mathematics-render--inline,
.tiptap-mathematics-render--block {
  display: inline !important;
  width: auto !important;
  min-width: 0 !important;
  max-width: none !important;
  min-height: 0 !important;
  height: auto !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  outline: 0 !important;
  vertical-align: baseline !important;
  color: inherit !important;
  font: inherit !important;
}

[data-equation-node-control="true"],
.equationNodeToolbar,
.equationActions,
[data-equation-actions],
.equationLabel,
.editorEquationLabel,
.mathNodeLabel,
[data-equation-label] {
  display: none !important;
  visibility: hidden !important;
  pointer-events: none !important;
}

.ProseMirror [data-document-utility-type^="quick-part-"]:empty,
.ProseMirror [data-document-utility-type="text-box"]:empty,
.ProseMirror [data-rendered-document-utility-type^="quick-part-"]:empty,
.ProseMirror [data-rendered-document-utility-type="text-box"]:empty,
.ProseMirror [data-rendered-quick-part-type^="quick-part-"]:empty,
.ProseMirror div[style*="background"]:empty,
.ProseMirror p[style*="background"]:empty,
.previewContent [data-document-utility-type^="quick-part-"]:empty,
.previewContent [data-document-utility-type="text-box"]:empty,
.previewContent [data-rendered-document-utility-type^="quick-part-"]:empty,
.previewContent [data-rendered-document-utility-type="text-box"]:empty,
.previewContent [data-rendered-quick-part-type^="quick-part-"]:empty,
.previewContent div[style*="background"]:empty,
.previewContent p[style*="background"]:empty {
  display: none !important;
  min-height: 0 !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}
`;


const equationEditableTextOnlyFinalCss = `
/* -------------------------------------------------------------------------- */
/* EQUATION FINAL: NORMAL EDITABLE TEXT ONLY                                   */
/* -------------------------------------------------------------------------- */

[data-equation-node-view="true"],
[data-editor-equation="true"],
[data-type="math"],
[data-type="mathematics"],
.editorEquationShell,
.editorEquationBlock,
.mathNodeView,
.equationNodeView,
.tiptap-mathematics-render,
.tiptap-mathematics-render--inline,
.tiptap-mathematics-render--block {
  display: inline !important;
  width: auto !important;
  min-width: 0 !important;
  max-width: none !important;
  min-height: 0 !important;
  height: auto !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  outline: 0 !important;
  vertical-align: baseline !important;
  color: inherit !important;
  font: inherit !important;
}

[data-equation-node-control="true"],
.equationNodeToolbar,
.equationActions,
[data-equation-actions],
.equationLabel,
.editorEquationLabel,
.mathNodeLabel,
[data-equation-label] {
  display: none !important;
  visibility: hidden !important;
  pointer-events: none !important;
}

.ProseMirror [data-document-utility-type^="quick-part-"]:empty,
.ProseMirror [data-document-utility-type="text-box"]:empty,
.ProseMirror [data-rendered-document-utility-type^="quick-part-"]:empty,
.ProseMirror [data-rendered-document-utility-type="text-box"]:empty,
.ProseMirror [data-rendered-quick-part-type^="quick-part-"]:empty,
.ProseMirror div[style*="background"]:empty,
.ProseMirror p[style*="background"]:empty,
.previewContent [data-document-utility-type^="quick-part-"]:empty,
.previewContent [data-document-utility-type="text-box"]:empty,
.previewContent [data-rendered-document-utility-type^="quick-part-"]:empty,
.previewContent [data-rendered-document-utility-type="text-box"]:empty,
.previewContent [data-rendered-quick-part-type^="quick-part-"]:empty,
.previewContent div[style*="background"]:empty,
.previewContent p[style*="background"]:empty {
  display: none !important;
  min-height: 0 !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}
`;


const equationPlainTextNoCardRuntimeCss = `
/* EQUATION PLAIN TEXT FINAL: no card, no static node controls */
[data-equation-node-view="true"],
[data-editor-equation="true"],
[data-type="math"],
[data-type="mathematics"],
.editorEquationShell,
.editorEquationBlock,
.mathNodeView,
.equationNodeView,
.tiptap-mathematics-render,
.tiptap-mathematics-render--inline,
.tiptap-mathematics-render--block {
  display: inline !important;
  width: auto !important;
  min-width: 0 !important;
  max-width: none !important;
  min-height: 0 !important;
  height: auto !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  outline: 0 !important;
  vertical-align: baseline !important;
  color: inherit !important;
  font: inherit !important;
}

[data-equation-node-control="true"],
.equationNodeToolbar,
.equationActions,
[data-equation-actions],
.equationLabel,
.editorEquationLabel,
.mathNodeLabel,
[data-equation-label] {
  display: none !important;
  visibility: hidden !important;
  pointer-events: none !important;
}

.ProseMirror [data-document-utility-type^="quick-part-"]:empty,
.ProseMirror [data-document-utility-type="text-box"]:empty,
.ProseMirror div[style*="background"]:empty,
.ProseMirror p[style*="background"]:empty {
  display: none !important;
  min-height: 0 !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}
`;

function convertEquationInputToLatex(value: string) {
  return value
    .replace(/√\s*\(([^()]*)\)/g, '\\sqrt{$1}')
    .replace(/√\s*\{([^{}]*)\}/g, '\\sqrt{$1}')
    .replace(/√\s*([A-Za-z0-9]+)/g, '\\sqrt{$1}')
    .replace(/∛\s*\(([^()]*)\)/g, '\\sqrt[3]{$1}')
    .replace(/∛\s*\{([^{}]*)\}/g, '\\sqrt[3]{$1}')
    .replace(/∛\s*([A-Za-z0-9]+)/g, '\\sqrt[3]{$1}')
    .replace(/∜\s*\(([^()]*)\)/g, '\\sqrt[4]{$1}')
    .replace(/∜\s*\{([^{}]*)\}/g, '\\sqrt[4]{$1}')
    .replace(/∜\s*([A-Za-z0-9]+)/g, '\\sqrt[4]{$1}')
    .replace(/([A-Za-z0-9)])²/g, '$1^2')
    .replace(/([A-Za-z0-9)])³/g, '$1^3')
    .replace(/([A-Za-z0-9)])ⁿ/g, '$1^n')
    .replace(/₀/g, '_0')
    .replace(/₁/g, '_1')
    .replace(/₂/g, '_2')
    .replace(/₃/g, '_3')
    .replace(/₄/g, '_4')
    .replace(/₅/g, '_5')
    .replace(/₆/g, '_6')
    .replace(/₇/g, '_7')
    .replace(/₈/g, '_8')
    .replace(/₉/g, '_9');
}

function convertLatexToEquationInput(value: string) {
  return value
    .replace(/\\sqrt\{([^{}]*)\}/g, '√($1)')
    .replace(/\\sqrt\[3\]\{([^{}]*)\}/g, '∛($1)')
    .replace(/\\sqrt\[4\]\{([^{}]*)\}/g, '∜($1)')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\^n/g, 'ⁿ')
    .replace(/_0/g, '₀')
    .replace(/_1/g, '₁')
    .replace(/_2/g, '₂')
    .replace(/_3/g, '₃')
    .replace(/_4/g, '₄')
    .replace(/_5/g, '₅')
    .replace(/_6/g, '₆')
    .replace(/_7/g, '₇')
    .replace(/_8/g, '₈')
    .replace(/_9/g, '₉');
}


function convertEquationInputToEditableText(value: string) {
  return convertLatexToEquationInput(value)
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
    .replace(/\\pm/g, '±')
    .replace(/\\mp/g, '∓')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\leq?/g, '≤')
    .replace(/\\geq?/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\infty/g, '∞')
    .replace(/\\pi/g, 'π')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\delta/g, 'δ')
    .replace(/\\theta/g, 'θ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\omega/g, 'ω')
    .replace(/\\sum/g, '∑')
    .replace(/\\int/g, '∫')
    .replace(/\\lim/g, 'lim')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildEditableEquationText(value: string) {
  const preparedValue = value.trim();

  if (!preparedValue) return '';

  return convertEquationInputToEditableText(preparedValue);
}




function insertEditableEquationText(editor: TiptapEditor, rawEquation: string) {
  const editableEquationText = buildEditableEquationText(rawEquation);

  if (!editableEquationText) return false;

  const { from, to } = editor.state.selection;
  const transaction = editor.state.tr.insertText(editableEquationText, from, to);
  const nextPosition = from + editableEquationText.length;

  transaction.setSelection(TextSelection.create(transaction.doc, nextPosition));
  editor.view.dispatch(transaction.scrollIntoView());
  editor.view.focus();

  return true;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizeHyperlinkHref(rawUrl: string) {
  const trimmedUrl = rawUrl.trim();

  if (!trimmedUrl) return '';

  if (/^(https?:|mailto:|tel:|ftp:|#|\/)/i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return `https://${trimmedUrl}`;
}

function createBookmarkSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'bookmark';
}

function createUniqueBookmarkId(baseValue: string, existingIds: string[]) {
  const baseId = createBookmarkSlug(baseValue);
  const usedIds = new Set(existingIds.map((id) => id.toLowerCase()));

  if (!usedIds.has(baseId.toLowerCase())) return baseId;

  let counter = 2;
  let nextId = `${baseId}-${counter}`;

  while (usedIds.has(nextId.toLowerCase())) {
    counter += 1;
    nextId = `${baseId}-${counter}`;
  }

  return nextId;
}

function getEditorSelectionText(editor: TiptapEditor) {
  const { from, to, empty } = editor.state.selection;

  if (empty) return '';

  return editor.state.doc.textBetween(from, to, ' ').trim();
}


function buildDocumentUtilityBlockRegex(
  utilityTypes: string | string[],
  flags = 'gi'
) {
  const types = Array.isArray(utilityTypes) ? utilityTypes : [utilityTypes];
  const pattern = types
    .map((type) => type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');

  return new RegExp(
    `<([a-z0-9]+)(?=[^>]*\\bdata-document-utility-type=["'](?:${pattern})["'])[^>]*>[\\s\\S]*?<\\/\\1>`,
    flags
  );
}

function stripDocumentUtilityBlocks(
  html: string,
  utilityTypes: string | string[]
) {
  return html.replace(buildDocumentUtilityBlockRegex(utilityTypes), '');
}

function extractDocumentUtilityBlock(
  html: string,
  utilityType: string
) {
  const blockRegex = buildDocumentUtilityBlockRegex(utilityType, 'i');
  const match = html.match(blockRegex);

  return {
    blockHtml: match?.[0] || '',
    html: html.replace(buildDocumentUtilityBlockRegex(utilityType), ''),
  };
}

function isPreviewPageBlank(html: string) {
  return /data-document-utility-type=["']blank-page["']/i.test(html);
}

function cleanDocumentPageSegment(html: string) {
  const cleanedHtml = stripDocumentUtilityBlocks(html, [
    'page-break',
    'page-break-body-start',
    'cover-page-body-start',
    'blank-page',
    'blank-page-body-start',
    'page-number',
    'document-header',
    'document-footer',
  ])
    .replace(/<p[^>]*>\s*<\/p>/gi, '')
    .trim();

  return cleanedHtml || '<p style="margin:0; min-height:1em;">&nbsp;</p>';
}

function normalizeQuickPartsForPreview(html: string) {
  return html.replace(
    /(<[a-z0-9]+)([^>]*?)\sdata-document-utility-type=(["'])(quick-part-[^"']+|cover-page|date-time)\3([^>]*>)/gi,
    (_match, tagStart: string, beforeAttr: string, quote: string, utilityType: string, afterAttr: string) => {
      if (String(utilityType).startsWith('quick-part-')) {
        return `${tagStart}${beforeAttr} data-rendered-quick-part-type=${quote}${utilityType}${quote}${afterAttr}`;
      }

      return `${tagStart}${beforeAttr} data-rendered-document-utility-type=${quote}${utilityType}${quote}${afterAttr}`;
    }
  );
}

function buildPagedDocumentHtml(
  rawHtml: string,
  options: {
    mode?: 'preview' | 'export';
    emptyMessage?: string;
  } = {}
) {
  const mode = options.mode || 'preview';
  const emptyMessage =
    options.emptyMessage ||
    '<p style="color:#94a3b8; font-style:italic;">Document content empty</p>';

  let workingHtml = rawHtml?.trim() || emptyMessage;

  workingHtml = normalizePreviewImageCropHtml(workingHtml);
  workingHtml = normalizeQuickPartsForPreview(workingHtml);

  const extractedHeader = extractDocumentUtilityBlock(workingHtml, 'document-header');
  const headerHtml = extractedHeader.blockHtml;
  workingHtml = extractedHeader.html;

  const extractedFooter = extractDocumentUtilityBlock(workingHtml, 'document-footer');
  const footerHtml = extractedFooter.blockHtml;
  workingHtml = extractedFooter.html;

  const pageBreakMarker = '<!--APP_TEXT_EDITOR_PAGE_BREAK-->';
  const pageBreakRegex = buildDocumentUtilityBlockRegex('page-break');
  const segments = workingHtml.replace(pageBreakRegex, pageBreakMarker).split(pageBreakMarker);

  const normalizedSegments = segments.length > 0 ? segments : [''];
  const pages = normalizedSegments.map((segment) => {
    const isBlankPage = isPreviewPageBlank(segment);

    return {
      isBlankPage,
      html: isBlankPage ? '<p style="margin:0; min-height:1em;">&nbsp;</p>' : cleanDocumentPageSegment(segment),
    };
  });

  const shouldShowPageNumbers = pages.length > 1;

  return pages
    .map((page, index) => {
      const isLastPage = index === pages.length - 1;
      const previewPageStyle =
        mode === 'preview'
          ? [
              '--same-view-page-padding:44px',
              'width:100%',
              'max-width:none',
              'min-height:720px',
              'display:flex',
              'flex-direction:column',
              'margin:0',
              'padding:44px',
              'background:#ffffff',
              'border:1px solid rgba(148,163,184,0.34)',
              'border-radius:14px',
              'box-shadow:0 10px 24px rgba(15,23,42,0.10), inset 0 0 0 1px rgba(255,255,255,0.72)',
              'box-sizing:border-box',
              'overflow:hidden',
              'overflow-wrap:anywhere',
              'word-break:break-word',
              isLastPage ? 'break-after:auto' : 'break-after:page',
              isLastPage ? 'page-break-after:auto' : 'page-break-after:always',
            ].join('; ')
          : [
              'min-height:100vh',
              'display:flex',
              'flex-direction:column',
              'box-sizing:border-box',
              'overflow:hidden',
              'overflow-wrap:anywhere',
              'word-break:break-word',
              isLastPage ? 'break-after:auto' : 'break-after:page',
              isLastPage ? 'page-break-after:auto' : 'page-break-after:always',
            ].join('; ');

      const header = headerHtml
        ? `<div data-document-preview-header="true" style="margin:0 0 8px; padding:0; border:0; color:#475569; font-size:12px; line-height:18px;">${headerHtml}</div>`
        : '';

      const footer = footerHtml
        ? `<div data-document-preview-footer="true" style="margin:0; padding:0; border:0; color:#475569; font-size:12px; line-height:18px;">${footerHtml}</div>`
        : '';

      const pageNumber = shouldShowPageNumbers
        ? `<div data-document-preview-page-number="true" style="margin:${footerHtml ? '8px' : 'auto'} 0 0; padding-top:10px; color:#64748b; font-size:12px; line-height:16px; text-align:center;">Page ${index + 1}</div>`
        : '';

      return `
        <section
          data-document-preview-page="true"
          data-document-preview-page-index="${index + 1}"
          data-document-preview-page-kind="${page.isBlankPage ? 'blank' : 'content'}"
          style="${previewPageStyle}"
        >
          ${header}
          <main data-document-preview-page-body="true" style="flex:1 1 auto; position:relative; min-width:0; width:100%; max-width:100%; min-height:0; overflow:hidden; overflow-wrap:anywhere; word-break:break-word; white-space:normal; box-sizing:border-box;">${page.html}</main>
          ${footer}
          ${pageNumber}
        </section>
      `;
    })
    .join('');
}

function getListStyleAttributes(listStyleType?: string | null) {
  if (!listStyleType) return {};

  if (nativeListStyleTypes.has(listStyleType)) {
    return {
      'data-list-style-type': listStyleType,
      style: `list-style-type: ${listStyleType};`,
    };
  }

  if (customBulletStyleMap[listStyleType]) {
    return {
      'data-list-style-type': listStyleType,
      style: `list-style-type: ${customBulletStyleMap[listStyleType]};`,
    };
  }

  return {
    'data-list-style-type': listStyleType,
  };
}


const ScreenPlaceholder = Extension.create<{ placeholder: string }>({
  name: 'screenPlaceholder',

  addOptions() {
    return {
      placeholder: 'Start typing...',
    };
  },

  addProseMirrorPlugins() {
    const editorInstance = this.editor;
    const placeholderText = this.options.placeholder || 'Start typing...';

    return [
      new Plugin({
        key: new PluginKey('screenPlaceholder'),
        props: {
          decorations(state) {
            if (!editorInstance?.isEditable) return null;

            const { doc } = state;
            const firstNode = doc.firstChild;
            const isEmptyDocument =
              doc.childCount === 1 &&
              Boolean(firstNode?.isTextblock) &&
              firstNode?.content.size === 0;

            if (!firstNode || !isEmptyDocument) return null;

            return DecorationSet.create(doc, [
              Decoration.node(0, firstNode.nodeSize, {
                class: 'is-editor-empty is-empty',
                'data-placeholder': placeholderText,
              }),
            ]);
          },
        },
      }),
    ];
  },
});

const StyledBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...(this.parent?.() || {}),
      listStyleType: {
        default: 'disc',
        parseHTML: (element) => {
          return (
            element.getAttribute('data-list-style-type') ||
            element.style.listStyleType ||
            'disc'
          );
        },
        renderHTML: (attributes) => {
          return getListStyleAttributes(attributes.listStyleType);
        },
      },
    };
  },
}).configure({
  keepMarks: true,
  keepAttributes: true,
});

const StyledOrderedList = OrderedList.extend({
  addAttributes() {
    return {
      ...(this.parent?.() || {}),
      listStyleType: {
        default: 'decimal',
        parseHTML: (element) => {
          return (
            element.getAttribute('data-list-style-type') ||
            element.style.listStyleType ||
            'decimal'
          );
        },
        renderHTML: (attributes) => {
          return getListStyleAttributes(attributes.listStyleType);
        },
      },
    };
  },
}).configure({
  keepMarks: true,
  keepAttributes: true,
});

const BlockLineHeight = Extension.create({
  name: 'blockLineHeight',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => element.style.lineHeight || null,
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) return {};

              return {
                style: `line-height: ${attributes.lineHeight};`,
              };
            },
          },
        },
      },
    ];
  },
});

const DocumentUtilityBlocks = Extension.create({
  name: 'documentUtilityBlocks',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'horizontalRule'],
        attributes: {
          documentUtilityType: {
            default: null,
            parseHTML: (element) =>
              element.getAttribute('data-document-utility-type') || null,
            renderHTML: (attributes) => {
              if (!attributes.documentUtilityType) return {};

              return {
                'data-document-utility-type': attributes.documentUtilityType,
              };
            },
          },
          documentUtilityStyle: {
            default: null,
            parseHTML: (element) =>
              element.getAttribute('data-document-utility-style') || null,
            renderHTML: (attributes) => {
              if (!attributes.documentUtilityStyle) return {};

              return {
                'data-document-utility-style': attributes.documentUtilityStyle,
                style: attributes.documentUtilityStyle,
              };
            },
          },
        },
      },
    ];
  },
});



type OnlineVideoKind = 'iframe' | 'video';

type OnlineVideoEmbedInfo = {
  kind: OnlineVideoKind;
  provider: string;
  src: string;
  originalUrl: string;
  title: string;
};

function normalizeOnlineVideoInput(rawUrl: string) {
  const trimmedUrl = rawUrl.trim();

  if (!trimmedUrl) return null;

  const urlWithProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmedUrl)
    ? trimmedUrl
    : `https://${trimmedUrl}`;

  try {
    const parsedUrl = new URL(urlWithProtocol);

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return null;
    }

    return parsedUrl;
  } catch {
    return null;
  }
}

function getYouTubeVideoId(url: URL) {
  const hostName = url.hostname.toLowerCase().replace(/^www\./, '');
  const pathParts = url.pathname.split('/').filter(Boolean);

  if (hostName === 'youtu.be') {
    return pathParts[0] || '';
  }

  if (hostName === 'youtube.com' || hostName.endsWith('.youtube.com')) {
    if (url.pathname === '/watch') return url.searchParams.get('v') || '';
    if (pathParts[0] === 'embed') return pathParts[1] || '';
    if (pathParts[0] === 'shorts') return pathParts[1] || '';
    if (pathParts[0] === 'live') return pathParts[1] || '';
  }

  return '';
}

function getVimeoVideoId(url: URL) {
  const hostName = url.hostname.toLowerCase().replace(/^www\./, '');

  if (hostName !== 'vimeo.com' && hostName !== 'player.vimeo.com') return '';

  const numericPart = url.pathname
    .split('/')
    .filter(Boolean)
    .find((part) => /^\d+$/.test(part));

  return numericPart || '';
}

function getOnlineVideoEmbedInfo(rawUrl: string): OnlineVideoEmbedInfo | null {
  const parsedUrl = normalizeOnlineVideoInput(rawUrl);

  if (!parsedUrl) return null;

  const originalUrl = parsedUrl.href;
  const hostName = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
  const youtubeVideoId = getYouTubeVideoId(parsedUrl);

  if (youtubeVideoId) {
    return {
      kind: 'iframe',
      provider: 'youtube',
      src: `https://www.youtube.com/embed/${encodeURIComponent(youtubeVideoId)}`,
      originalUrl,
      title: 'YouTube video',
    };
  }

  const vimeoVideoId = getVimeoVideoId(parsedUrl);

  if (vimeoVideoId) {
    return {
      kind: 'iframe',
      provider: 'vimeo',
      src: `https://player.vimeo.com/video/${encodeURIComponent(vimeoVideoId)}`,
      originalUrl,
      title: 'Vimeo video',
    };
  }

  if (/\.(mp4|webm|ogg)(?:$|[?#])/i.test(parsedUrl.pathname)) {
    return {
      kind: 'video',
      provider: 'direct',
      src: originalUrl,
      originalUrl,
      title: 'Online video',
    };
  }

  if (
    hostName.includes('youtube-nocookie.com') ||
    hostName.includes('player.vimeo.com') ||
    parsedUrl.pathname.includes('/embed/')
  ) {
    return {
      kind: 'iframe',
      provider: 'embed',
      src: originalUrl,
      originalUrl,
      title: 'Embedded online video',
    };
  }

  return {
    kind: 'iframe',
    provider: 'generic',
    src: originalUrl,
    originalUrl,
    title: 'Online video',
  };
}

function renderOnlineVideoHtml(embedInfo: OnlineVideoEmbedInfo): DOMOutputSpec {
  const safeTitle = embedInfo.title || 'Online video';

  if (embedInfo.kind === 'video') {
    return [
      'div',
      {
        'data-online-video': 'true',
        'data-online-video-kind': 'video',
        'data-online-video-provider': embedInfo.provider,
        'data-online-video-src': embedInfo.src,
        'data-online-video-original-url': embedInfo.originalUrl,
        'data-online-video-title': safeTitle,
      },
      ['video', {
        src: embedInfo.src,
        controls: 'true',
        preload: 'metadata',
        title: safeTitle,
      }],
    ] as DOMOutputSpec;
  }

  return [
    'div',
    {
      'data-online-video': 'true',
      'data-online-video-kind': 'iframe',
      'data-online-video-provider': embedInfo.provider,
      'data-online-video-src': embedInfo.src,
      'data-online-video-original-url': embedInfo.originalUrl,
      'data-online-video-title': safeTitle,
    },
    ['iframe', {
      src: embedInfo.src,
      title: safeTitle,
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
      allowfullscreen: 'true',
      referrerpolicy: 'strict-origin-when-cross-origin',
    }],
  ] as DOMOutputSpec;
}

function OnlineVideoNodeView({
  node,
  selected,
  editor,
  deleteNode,
  getPos,
}: NodeViewProps) {
  const attrs = node.attrs as {
    src?: string;
    originalUrl?: string;
    kind?: OnlineVideoKind;
    provider?: string;
    title?: string;
  };

  const onlineVideoWrapperRef = useRef<HTMLDivElement | null>(null);
  const [showOnlineVideoControls, setShowOnlineVideoControls] = useState(false);

  const kind: OnlineVideoKind = attrs.kind === 'video' ? 'video' : 'iframe';
  const src = attrs.src || attrs.originalUrl || '';
  const title = attrs.title || 'Online video';
  const controlsVisible = selected && showOnlineVideoControls;

  useEffect(() => {
    if (!selected && showOnlineVideoControls) {
      setShowOnlineVideoControls(false);
    }
  }, [selected, showOnlineVideoControls]);

  useEffect(() => {
    function handleDocumentMouseDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;

      if (!target) return;
      if (onlineVideoWrapperRef.current?.contains(target)) return;

      setShowOnlineVideoControls(false);
    }

    document.addEventListener('mousedown', handleDocumentMouseDown, true);

    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown, true);
    };
  }, []);

  function selectOnlineVideoNode() {
    if (typeof getPos !== 'function') return;

    const position = getPos();

    if (typeof position === 'number') {
      editor.commands.setNodeSelection(position);
    }
  }

  function stopOnlineVideoControlMouseDown(event: ReactMouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleOnlineVideoWrapperClick(event: ReactMouseEvent<HTMLDivElement>) {
    const eventTarget = event.target as HTMLElement;

    if (eventTarget.closest('[data-online-video-node-control="true"]')) return;

    event.preventDefault();
    event.stopPropagation();
    setShowOnlineVideoControls(true);
    selectOnlineVideoNode();
  }

  function handleOnlineVideoDelete(event: ReactMouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (typeof getPos === 'function') {
      try {
        const position = getPos();

        if (typeof position === 'number') {
          const { state, view } = editor;
          const resolvedPosition = state.doc.resolve(position);
          const parentNode = resolvedPosition.parent;

          if (
            resolvedPosition.depth > 0 &&
            parentNode.type.name === 'textBoxCallout'
          ) {
            let onlineVideoChildCount = 0;
            let hasOnlyThisVideoAndEmptyBlocks = true;

            parentNode.forEach((childNode) => {
              if (childNode.type.name === 'onlineVideo') {
                onlineVideoChildCount += 1;
                return;
              }

              if (
                childNode.type.name === 'paragraph' &&
                childNode.textContent.trim().length === 0
              ) {
                return;
              }

              hasOnlyThisVideoAndEmptyBlocks = false;
            });

            if (onlineVideoChildCount === 1 && hasOnlyThisVideoAndEmptyBlocks) {
              const parentFrom = resolvedPosition.before(resolvedPosition.depth);
              const parentTo = resolvedPosition.after(resolvedPosition.depth);

              view.dispatch(
                state.tr.deleteRange(parentFrom, parentTo).scrollIntoView()
              );
              editor.commands.focus();
              return;
            }
          }
        }
      } catch {
        // Fall back to deleting only the online video node.
      }
    }

    deleteNode();
    editor.commands.focus();
  }

  const wrapperClassName = [
    styles.onlineVideoNodeView,
    selected ? styles.onlineVideoNodeViewSelected : '',
    controlsVisible ? styles.onlineVideoNodeViewControlsVisible : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <NodeViewWrapper
      as="div"
      ref={onlineVideoWrapperRef}
      className={wrapperClassName}
      data-online-video="true"
      data-online-video-kind={kind}
      data-online-video-provider={attrs.provider || 'generic'}
      data-online-video-src={src}
      data-online-video-original-url={attrs.originalUrl || src}
      data-online-video-title={title}
      data-online-video-controls-visible={controlsVisible ? 'true' : 'false'}
      contentEditable={false}
      draggable={false}
      onClick={handleOnlineVideoWrapperClick}
    >
      <div
        className={styles.onlineVideoNodeFloatingToolbar}
        data-online-video-node-control="true"
        contentEditable={false}
      >
        <button
          type="button"
          className={styles.onlineVideoNodeDeleteButton}
          onMouseDown={stopOnlineVideoControlMouseDown}
          onClick={handleOnlineVideoDelete}
          title="Delete Online Video"
          aria-label="Delete Online Video"
        >
          <Trash2 />
          Delete
        </button>
      </div>

      {kind === 'video' ? (
        <video
          className={styles.onlineVideoNodeFrame}
          src={src}
          controls
          preload="metadata"
          title={title}
        />
      ) : (
        <iframe
          className={styles.onlineVideoNodeFrame}
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
    </NodeViewWrapper>
  );
}

const OnlineVideo = Node.create({
  name: 'onlineVideo',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  defining: true,

  addAttributes() {
    return {
      src: {
        default: '',
        parseHTML: (element) =>
          element.getAttribute('data-online-video-src') ||
          element.querySelector('iframe, video')?.getAttribute('src') ||
          '',
        renderHTML: (attributes) => ({
          'data-online-video-src': attributes.src || '',
        }),
      },
      originalUrl: {
        default: '',
        parseHTML: (element) =>
          element.getAttribute('data-online-video-original-url') ||
          element.getAttribute('data-online-video-src') ||
          element.querySelector('iframe, video')?.getAttribute('src') ||
          '',
        renderHTML: (attributes) => ({
          'data-online-video-original-url': attributes.originalUrl || attributes.src || '',
        }),
      },
      kind: {
        default: 'iframe',
        parseHTML: (element) => element.getAttribute('data-online-video-kind') || 'iframe',
        renderHTML: (attributes) => ({
          'data-online-video-kind': attributes.kind || 'iframe',
        }),
      },
      provider: {
        default: 'generic',
        parseHTML: (element) => element.getAttribute('data-online-video-provider') || 'generic',
        renderHTML: (attributes) => ({
          'data-online-video-provider': attributes.provider || 'generic',
        }),
      },
      title: {
        default: 'Online video',
        parseHTML: (element) =>
          element.getAttribute('data-online-video-title') ||
          element.querySelector('iframe, video')?.getAttribute('title') ||
          'Online video',
        renderHTML: (attributes) => ({
          'data-online-video-title': attributes.title || 'Online video',
        }),
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-online-video="true"]' },
    ];
  },

  renderHTML({ node }) {
    const attrs = node.attrs as {
      src?: string;
      originalUrl?: string;
      kind?: OnlineVideoKind;
      provider?: string;
      title?: string;
    };

    const embedInfo: OnlineVideoEmbedInfo = {
      kind: attrs.kind === 'video' ? 'video' : 'iframe',
      provider: attrs.provider || 'generic',
      src: attrs.src || attrs.originalUrl || '',
      originalUrl: attrs.originalUrl || attrs.src || '',
      title: attrs.title || 'Online video',
    };

    return renderOnlineVideoHtml(embedInfo);
  },

  addNodeView() {
    return ReactNodeViewRenderer(OnlineVideoNodeView);
  },
});


const equationSuperscriptMap: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  '=': '⁼',
  '(': '⁽',
  ')': '⁾',
  n: 'ⁿ',
  i: 'ⁱ',
};

const equationSubscriptMap: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
  '+': '₊',
  '-': '₋',
  '=': '₌',
  '(': '₍',
  ')': '₎',
  a: 'ₐ',
  e: 'ₑ',
  h: 'ₕ',
  i: 'ᵢ',
  j: 'ⱼ',
  k: 'ₖ',
  l: 'ₗ',
  m: 'ₘ',
  n: 'ₙ',
  o: 'ₒ',
  p: 'ₚ',
  r: 'ᵣ',
  s: 'ₛ',
  t: 'ₜ',
  u: 'ᵤ',
  v: 'ᵥ',
  x: 'ₓ',
};

const equationCommandSymbolMap: Record<string, string> = {
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  epsilon: 'ε',
  theta: 'θ',
  lambda: 'λ',
  mu: 'μ',
  pi: 'π',
  rho: 'ρ',
  sigma: 'σ',
  tau: 'τ',
  phi: 'φ',
  omega: 'ω',
  Gamma: 'Γ',
  Delta: 'Δ',
  Theta: 'Θ',
  Lambda: 'Λ',
  Pi: 'Π',
  Sigma: 'Σ',
  Phi: 'Φ',
  Omega: 'Ω',
  times: '×',
  div: '÷',
  pm: '±',
  mp: '∓',
  neq: '≠',
  ne: '≠',
  approx: '≈',
  equiv: '≡',
  le: '≤',
  leq: '≤',
  ge: '≥',
  geq: '≥',
  infty: '∞',
  infinity: '∞',
  sum: '∑',
  prod: '∏',
  int: '∫',
  oint: '∮',
  partial: '∂',
  nabla: '∇',
  cdot: '·',
  to: '→',
  rightarrow: '→',
  leftarrow: '←',
  leftrightarrow: '↔',
  forall: '∀',
  exists: '∃',
  emptyset: '∅',
  cup: '∪',
  cap: '∩',
  subset: '⊂',
  superset: '⊃',
  subseteq: '⊆',
  supseteq: '⊇',
  in: '∈',
  notin: '∉',
  perp: '⊥',
  parallel: '∥',
  angle: '∠',
  degree: '°',
};

function equationToRaisedOrLoweredText(value: string, marker: '^' | '_', map: Record<string, string>) {
  let result = '';

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (char !== marker) {
      result += char;
      continue;
    }

    const nextChar = value[index + 1];

    if (!nextChar) continue;

    if (nextChar === '{') {
      const closeIndex = value.indexOf('}', index + 2);

      if (closeIndex > index) {
        const groupValue = value.slice(index + 2, closeIndex);
        result += groupValue
          .split('')
          .map((groupChar) => map[groupChar] || groupChar)
          .join('');
        index = closeIndex;
        continue;
      }
    }

    result += map[nextChar] || nextChar;
    index += 1;
  }

  return result;
}

function normalizeEquationDisplayText(value: string) {
  if (!value) return '';

  let nextValue = value
    .replace(/\\left/g, '')
    .replace(/\\right/g, '')
    .replace(/\\,/g, ' ')
    .replace(/\\;/g, ' ')
    .replace(/\\:/g, ' ')
    .replace(/\\\s+/g, ' ')
    .replace(/\\sqrt\[3\]\{([^{}]+)\}/g, '∛$1')
    .replace(/\\sqrt\[4\]\{([^{}]+)\}/g, '∜$1')
    .replace(/\\sqrt\{([^{}]+)\}/g, '√$1')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1⁄$2')
    .replace(/\\lim_\{([^{}]+)\}/g, 'lim $1')
    .replace(/\\sum_\{([^{}]+)\}\^\{([^{}]+)\}/g, '∑$1→$2')
    .replace(/\\int_\{([^{}]+)\}\^\{([^{}]+)\}/g, '∫$1→$2')
    .replace(/\\sin/g, 'sin')
    .replace(/\\cos/g, 'cos')
    .replace(/\\tan/g, 'tan')
    .replace(/\\log/g, 'log')
    .replace(/\\ln/g, 'ln');

  nextValue = nextValue.replace(/\\([A-Za-z]+)/g, (match, command: string) => {
    return equationCommandSymbolMap[command] || match.replace('\\', '');
  });

  nextValue = equationToRaisedOrLoweredText(nextValue, '^', equationSuperscriptMap);
  nextValue = equationToRaisedOrLoweredText(nextValue, '_', equationSubscriptMap);

  return nextValue
    .replace(/\*/g, '×')
    .replace(/-/g, '−')
    .replace(/\s+/g, ' ')
    .trim();
}

function getEquationSymbolInsertValue(symbol: string) {
  const symbolInsertMap: Record<string, string> = {
    '√()': '\\sqrt{}',
    '∛()': '\\sqrt[3]{}',
    '∑': '\\sum_{}^{}',
    '∫': '\\int_{}^{}',
    '()': '\\left(\\right)',
    '[]': '\\left[\\right]',
    '{}': '\\left\\{\\right\\}',
    '⁄': '\\frac{}{}',
  };

  return symbolInsertMap[symbol] || symbol;
}


function EquationNodeView({
  node,
  selected,
  editor,
  deleteNode,
  getPos,
}: NodeViewProps) {
  const equationWrapperRef = useRef<HTMLDivElement | null>(null);
  const [showEquationControls, setShowEquationControls] = useState(false);

  const attrs = node.attrs as {
    latex?: string;
    display?: EquationDisplayMode;
  };

  const latex = String(attrs.latex || '').trim();
  const displayMode: EquationDisplayMode = attrs.display === 'inline' ? 'inline' : 'block';
  const controlsVisible = selected && showEquationControls;

  useEffect(() => {
    if (!selected && showEquationControls) {
      setShowEquationControls(false);
    }
  }, [selected, showEquationControls]);

  useEffect(() => {
    function handleDocumentMouseDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;

      if (!target) return;
      if (equationWrapperRef.current?.contains(target)) return;

      setShowEquationControls(false);
    }

    document.addEventListener('mousedown', handleDocumentMouseDown, true);

    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown, true);
    };
  }, []);

  function selectEquationNode() {
    if (typeof getPos !== 'function') return;

    const position = getPos();

    if (typeof position === 'number') {
      editor.commands.setNodeSelection(position);
    }
  }

  function stopEquationControlMouseDown(event: ReactMouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleEquationWrapperClick(event: ReactMouseEvent<HTMLDivElement>) {
    const eventTarget = event.target as HTMLElement;

    if (eventTarget.closest('[data-equation-node-control="true"]')) return;

    event.preventDefault();
    event.stopPropagation();
    setShowEquationControls(true);
    selectEquationNode();
  }

  function handleEquationEdit(event: ReactMouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (typeof getPos !== 'function') return;

    const position = getPos();

    if (typeof position !== 'number') return;

    const editorId = editor.view.dom.getAttribute('id') || '';

    window.dispatchEvent(
      new CustomEvent<EquationEditEventDetail>('app-text-editor-equation-edit', {
        detail: {
          editorId,
          position,
          latex,
          display: displayMode,
        },
      })
    );
  }

  function handleEquationDelete(event: ReactMouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    deleteNode();
    editor.commands.focus();
  }

  const wrapperClassName = [
    styles.equationNodeView,
    displayMode === 'inline' ? styles.equationNodeViewInline : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <NodeViewWrapper
      as="div"
      ref={equationWrapperRef}
      className={wrapperClassName}
      data-editor-equation="true"
      data-equation-display={displayMode}
      data-equation-latex={latex}
      contentEditable={false}
      draggable={false}
      onClick={handleEquationWrapperClick}
    >
      <div className={styles.equationNodeFormula} aria-label="Equation">
        {normalizeEquationDisplayText(latex) || 'Empty equation'}
      </div>
      <div className={styles.equationNodeCaption}>
        {displayMode === 'inline' ? 'Inline equation' : 'Equation'}
      </div>
    </NodeViewWrapper>
  );
}

const EditableEquation = Node.create({
  name: 'editableEquation',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,
  defining: true,

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: (element) =>
          element.getAttribute('data-equation-latex') ||
          element.textContent?.trim() ||
          '',
        renderHTML: (attributes) => ({
          'data-equation-latex': attributes.latex || '',
        }),
      },
      display: {
        default: 'block',
        parseHTML: (element) =>
          element.getAttribute('data-equation-display') === 'inline' ? 'inline' : 'block',
        renderHTML: (attributes) => ({
          'data-equation-display': attributes.display === 'inline' ? 'inline' : 'block',
        }),
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-editor-equation="true"]' },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const latex = String(node.attrs.latex || '').trim();
    const displayMode: EquationDisplayMode = node.attrs.display === 'inline' ? 'inline' : 'block';

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-editor-equation': 'true',
        'data-equation-display': displayMode,
        'data-equation-latex': latex,
      }),
      ['span', { 'data-equation-preview': 'true' }, normalizeEquationDisplayText(latex) || 'Empty equation'],
    ] as DOMOutputSpec;
  },

  addNodeView() {
    return ReactNodeViewRenderer(EquationNodeView);
  },
});


const BookmarkAnchor = Node.create({
  name: 'bookmarkAnchor',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      id: {
        default: '',
        parseHTML: (element) => element.getAttribute('id') || '',
        renderHTML: (attributes) => ({
          id: attributes.id || '',
        }),
      },
      name: {
        default: 'Bookmark',
        parseHTML: (element) =>
          element.getAttribute('data-bookmark-name') ||
          element.textContent?.replace(/^🔖\s*/, '').trim() ||
          element.getAttribute('id') ||
          'Bookmark',
        renderHTML: (attributes) => ({
          'data-bookmark-name': attributes.name || attributes.id || 'Bookmark',
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-bookmark="true"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const bookmarkId = String(HTMLAttributes.id || 'bookmark');
    const bookmarkName = String(
      HTMLAttributes.name ||
      HTMLAttributes['data-bookmark-name'] ||
      bookmarkId ||
      'Bookmark'
    );

    const bookmarkAttributes = { ...(HTMLAttributes as Record<string, string>) };
    delete bookmarkAttributes.name;

    return [
      'span',
      mergeAttributes(bookmarkAttributes, {
        id: bookmarkId,
        'data-bookmark': 'true',
        'data-bookmark-name': bookmarkName,
        contenteditable: 'false',
        title: `Bookmark: ${bookmarkName}`,
      }),
      `🔖 ${bookmarkName}`,
    ] as DOMOutputSpec;
  },
});

function TextBoxCalloutNodeView({ node }: NodeViewProps) {
  const hasTextBoxContent = node.textContent.trim().length > 0;

  const wrapperStyle: CSSProperties = {
    width: '100%',
    maxWidth: '100%',
    minHeight: 86,
    display: 'block',
    position: 'relative',
    margin: '12px 0 16px',
    padding: 0,
    border: '1px solid #9bbbe7',
    borderLeft: '1px solid #9bbbe7',
    borderRadius: 2,
    background: '#ffffff',
    color: '#0f172a',
    boxSizing: 'border-box',
    overflow: 'hidden',
  };

  const contentWrapStyle: CSSProperties = {
    minWidth: 0,
    display: 'block',
    minHeight: hasTextBoxContent ? 62 : 84,
    padding: '12px 14px',
    background: '#ffffff',
    outline: 'none',
  };

  return (
    <NodeViewWrapper
      as="div"
      data-text-box-callout="true"
      data-text-box-actions-visible="false"
      style={wrapperStyle}
    >
      <NodeViewContent
        as="div"
        data-text-box-content="true"
        data-placeholder="Type inside text box..."
        style={contentWrapStyle}
      />
    </NodeViewWrapper>
  );
}

const TextBoxCallout = Node.create({
  name: 'textBoxCallout',
  group: 'block',
  content: 'block+',
  defining: true,
  priority: 1000,

  addAttributes() {
    return {
      saved: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-text-box-saved') || null,
        renderHTML: (attributes) => {
          if (!attributes.saved) return {};

          return {
            'data-text-box-saved': attributes.saved,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-text-box-callout="true"]' },
      { tag: 'blockquote[data-text-box-callout="true"]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-text-box-callout': 'true',
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TextBoxCalloutNodeView);
  },
});

type ImageAlignMode = 'inline' | 'left' | 'center' | 'right' | 'float-left' | 'float-right' | 'free';

type ImageCropValues = {
  top?: string | number | null;
  right?: string | number | null;
  bottom?: string | number | null;
  left?: string | number | null;
};

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function numberFromAttribute(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeCropValue(value: unknown) {
  return clampNumber(numberFromAttribute(value, 0), 0, 80);
}

function buildImageCropStyle(crop?: ImageCropValues | null) {
  const top = normalizeCropValue(crop?.top);
  const right = normalizeCropValue(crop?.right);
  const bottom = normalizeCropValue(crop?.bottom);
  const left = normalizeCropValue(crop?.left);

  if (top <= 0 && right <= 0 && bottom <= 0 && left <= 0) return '';

  return ` clip-path: inset(${top}% ${right}% ${bottom}% ${left}%);`;
}

function readHtmlAttribute(tag: string, attributeName: string) {
  const attributeRegex = new RegExp(`${attributeName}=(?:"([^"]*)"|'([^']*)')`, 'i');
  const match = tag.match(attributeRegex);

  return match?.[1] ?? match?.[2] ?? '';
}

function stripHtmlAttribute(tag: string, attributeName: string) {
  const attributeRegex = new RegExp(`\\s${attributeName}=(?:"[^"]*"|'[^']*')`, 'gi');

  return tag.replace(attributeRegex, '');
}

function removeInlineClipPath(styleValue: string) {
  return styleValue
    .replace(/clip-path\s*:\s*inset\([^)]*\)\s*;?/gi, '')
    .replace(/-webkit-clip-path\s*:\s*inset\([^)]*\)\s*;?/gi, '')
    .replace(/;\s*;/g, ';')
    .trim();
}

function buildImagePreviewLayoutStyle(
  width?: string | null,
  imageAlign?: string | null,
  imageX?: string | number | null,
  imageY?: string | number | null,
  crop?: ImageCropValues | null
) {
  const safeWidth = width || '60%';
  const top = normalizeCropValue(crop?.top);
  const right = normalizeCropValue(crop?.right);
  const bottom = normalizeCropValue(crop?.bottom);
  const left = normalizeCropValue(crop?.left);
  const visibleCropWidthPercent = clampNumber(100 - left - right, 20, 100);
  const visibleCropWidthScale = visibleCropWidthPercent / 100;
  const previewWidth = scaleImageCssSize(safeWidth, visibleCropWidthScale);
  const normalizedAlign = imageAlign || 'left';
  const baseStyle = [
    `width: ${previewWidth}`,
    'max-width: 100%',
    'line-height: 0',
    'overflow: hidden',
    'border-radius: 14px',
    'box-sizing: border-box',
    'vertical-align: top',
  ].join('; ') + ';';

  if (normalizedAlign === 'left') {
    return `${baseStyle} display: block; margin: 10px auto 10px 0;`;
  }

  if (normalizedAlign === 'center') {
    return `${baseStyle} display: block; margin: 10px auto;`;
  }

  if (normalizedAlign === 'right') {
    return `${baseStyle} display: block; margin: 10px 0 10px auto;`;
  }

  if (normalizedAlign === 'float-left') {
    return `${baseStyle} display: block; float: left; margin: 6px 16px 10px 0;`;
  }

  if (normalizedAlign === 'float-right') {
    return `${baseStyle} display: block; float: right; margin: 6px 0 10px 16px;`;
  }

  if (normalizedAlign === 'free') {
    const x = numberFromAttribute(imageX, 0);
    const y = numberFromAttribute(imageY, 0);

    return [
      baseStyle,
      'position: absolute',
      `left: max(0px, calc(${x}px - var(--same-view-page-padding, 44px)))`,
      `top: max(0px, calc(${y}px - var(--same-view-page-padding, 44px)))`,
      'z-index: 1',
      'display: block',
      'margin: 0',
    ].join('; ') + ';';
  }

  return `${baseStyle} display: inline-block; margin: 8px 0;`;
}

function normalizePreviewImageCropHtml(html: string) {
  return html.replace(/<img\b[^>]*>/gi, (imageTag) => {
    if (imageTag.includes('data-preview-cropped-image="true"')) return imageTag;

    const cropTop = normalizeCropValue(readHtmlAttribute(imageTag, 'data-image-crop-top'));
    const cropRight = normalizeCropValue(readHtmlAttribute(imageTag, 'data-image-crop-right'));
    const cropBottom = normalizeCropValue(readHtmlAttribute(imageTag, 'data-image-crop-bottom'));
    const cropLeft = normalizeCropValue(readHtmlAttribute(imageTag, 'data-image-crop-left'));
    const width = readHtmlAttribute(imageTag, 'data-image-width') || '60%';
    const imageAlign = readHtmlAttribute(imageTag, 'data-image-align') || 'left';
    const imageX = readHtmlAttribute(imageTag, 'data-image-x') || '0';
    const imageY = readHtmlAttribute(imageTag, 'data-image-y') || '0';
    const naturalWidth = numberFromAttribute(readHtmlAttribute(imageTag, 'data-image-natural-width'), 16);
    const naturalHeight = numberFromAttribute(readHtmlAttribute(imageTag, 'data-image-natural-height'), 9);
    const visibleCropWidthPercent = clampNumber(100 - cropLeft - cropRight, 20, 100);
    const visibleCropHeightPercent = clampNumber(100 - cropTop - cropBottom, 20, 100);
    const wrapperStyle = buildImagePreviewLayoutStyle(width, imageAlign, imageX, imageY, {
      top: cropTop,
      right: cropRight,
      bottom: cropBottom,
      left: cropLeft,
    });
    const viewportAspectRatio = `${Math.max(1, naturalWidth * visibleCropWidthPercent)} / ${Math.max(1, naturalHeight * visibleCropHeightPercent)}`;
    const viewportStyle = `width: 100%; max-width: 100%; position: relative; overflow: hidden; border-radius: 14px; line-height: 0; aspect-ratio: ${viewportAspectRatio}; box-sizing: border-box;`;
    const imageStyle = cropTop > 0 || cropRight > 0 || cropBottom > 0 || cropLeft > 0
      ? `position: absolute; left: 0; top: 0; width: ${10000 / visibleCropWidthPercent}%; max-width: none; height: auto; margin: 0; border-radius: 14px; transform: translate(-${cropLeft}%, -${cropTop}%); display: block;`
      : 'position: absolute; left: 0; top: 0; width: 100%; max-width: none; height: auto; margin: 0; border-radius: 14px; transform: none; display: block;';
    const cleanedTag = stripHtmlAttribute(imageTag, 'style')
      .replace(/<img/i, '<img data-preview-cropped-image="true"')
      .replace(/\s*\/?>(\s*)$/i, ` style="${escapeHtml(imageStyle)}" />`);

    return `<span data-preview-image-frame="true" data-image-align="${escapeHtml(imageAlign)}" style="${escapeHtml(wrapperStyle)}"><span data-preview-image-crop-viewport="true" style="${escapeHtml(viewportStyle)}">${cleanedTag}</span></span>`;
  });
}

function buildImageLayoutStyle(
  width?: string | null,
  imageAlign?: string | null,
  imageX?: string | number | null,
  imageY?: string | number | null,
  crop?: ImageCropValues | null
) {
  const safeWidth = width || '60%';
  const baseStyle = `width: ${safeWidth}; max-width: 100%; height: auto;`;

  if (imageAlign === 'left') {
    return `${baseStyle} display: block; margin: 10px auto 10px 0;`;
  }

  if (imageAlign === 'center') {
    return `${baseStyle} display: block; margin: 10px auto;`;
  }

  if (imageAlign === 'right') {
    return `${baseStyle} display: block; margin: 10px 0 10px auto;`;
  }

  if (imageAlign === 'float-left') {
    return `${baseStyle} float: left; margin: 6px 16px 10px 0;`;
  }

  if (imageAlign === 'float-right') {
    return `${baseStyle} float: right; margin: 6px 0 10px 16px;`;
  }

  if (imageAlign === 'free') {
    const x = numberFromAttribute(imageX, 0);
    const y = numberFromAttribute(imageY, 0);

    return `${baseStyle} position: absolute; left: ${x}px; top: ${y}px; z-index: 5; display: block; margin: 0;`;
  }

  return `${baseStyle} display: inline-block; margin: 8px 0;`;
}


function scaleImageCssSize(size: string, scale: number) {
  const safeScale = clampNumber(scale, 0.2, 1);
  const safeSize = size || '60%';
  const trimmedSize = safeSize.trim();
  const numericMatch = trimmedSize.match(/^(-?\d+(?:\.\d+)?)(px|%|rem|em|vw|vh)?$/i);

  if (numericMatch) {
    const numericValue = Number.parseFloat(numericMatch[1]);
    const unit = numericMatch[2] || 'px';

    if (Number.isFinite(numericValue)) {
      return `${Math.max(1, numericValue * safeScale)}${unit}`;
    }
  }

  return `calc(${trimmedSize} * ${safeScale})`;
}

function getImageNodeViewLayoutStyle(
  width: string,
  imageAlign: ImageAlignMode,
  imageX: number,
  imageY: number,
  isSelected: boolean,
  dragPosition: { x: number; y: number } | null
): CSSProperties {
  const safeWidth = width || '60%';
  const currentX = dragPosition?.x ?? imageX;
  const currentY = dragPosition?.y ?? imageY;

  if (imageAlign === 'left') {
    return {
      width: safeWidth,
      display: 'block',
      margin: '10px auto 10px 0',
    };
  }

  if (imageAlign === 'center') {
    return {
      width: safeWidth,
      display: 'block',
      margin: '10px auto',
    };
  }

  if (imageAlign === 'right') {
    return {
      width: safeWidth,
      display: 'block',
      margin: '10px 0 10px auto',
    };
  }

  if (imageAlign === 'float-left') {
    return {
      width: safeWidth,
      float: 'left',
      margin: '6px 16px 10px 0',
    };
  }

  if (imageAlign === 'float-right') {
    return {
      width: safeWidth,
      float: 'right',
      margin: '6px 0 10px 16px',
    };
  }

  if (imageAlign === 'free') {
    return {
      width: safeWidth,
      position: 'absolute',
      left: `${currentX}px`,
      top: `${currentY}px`,
      zIndex: isSelected ? 24 : 8,
      margin: 0,
    };
  }

  return {
    width: safeWidth,
    display: 'inline-block',
    margin: '8px 0',
  };
}

function InteractiveImageNodeView({
  node,
  selected,
  updateAttributes,
  deleteNode,
  editor,
  getPos,
}: NodeViewProps) {
  const attrs = node.attrs as {
    src?: string;
    alt?: string;
    title?: string;
    width?: string;
    imageAlign?: ImageAlignMode;
    imageX?: string | number;
    imageY?: string | number;
    cropTop?: string | number;
    cropRight?: string | number;
    cropBottom?: string | number;
    cropLeft?: string | number;
    imageNaturalWidth?: string | number;
    imageNaturalHeight?: string | number;
  };

  const imageWrapperRef = useRef<HTMLDivElement | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [dragEnabled, setDragEnabled] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(() => {
    const naturalWidth = numberFromAttribute(attrs.imageNaturalWidth, 0);
    const naturalHeight = numberFromAttribute(attrs.imageNaturalHeight, 0);

    if (naturalWidth > 0 && naturalHeight > 0) {
      return {
        width: naturalWidth,
        height: naturalHeight,
      };
    }

    return null;
  });
  const [showImageControls, setShowImageControls] = useState(false);

  const width = attrs.width || '60%';
  const imageAlign = attrs.imageAlign || 'center';
  const imageX = numberFromAttribute(attrs.imageX, 0);
  const imageY = numberFromAttribute(attrs.imageY, 0);
  const cropTop = normalizeCropValue(attrs.cropTop);
  const cropRight = normalizeCropValue(attrs.cropRight);
  const cropBottom = normalizeCropValue(attrs.cropBottom);
  const cropLeft = normalizeCropValue(attrs.cropLeft);
  const visibleCropWidthPercent = clampNumber(100 - cropLeft - cropRight, 20, 100);
  const visibleCropHeightPercent = clampNumber(100 - cropTop - cropBottom, 20, 100);
  const visibleCropWidthScale = visibleCropWidthPercent / 100;
  const croppedLayoutWidth = scaleImageCssSize(width, visibleCropWidthScale);
  const imageControlsVisible = selected && showImageControls;

  useEffect(() => {
    if (!selected) {
      if (showImageControls) setShowImageControls(false);
      if (cropMode) setCropMode(false);
      if (dragEnabled) setDragEnabled(false);
    }
  }, [selected, showImageControls, cropMode, dragEnabled]);

  useEffect(() => {
    function handleDocumentMouseDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;

      if (!target) return;
      if (imageWrapperRef.current?.contains(target)) return;

      setShowImageControls(false);
      setCropMode(false);
      setDragEnabled(false);
    }

    document.addEventListener('mousedown', handleDocumentMouseDown, true);

    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown, true);
    };
  }, []);

  function selectImageNode() {
    if (typeof getPos !== 'function') return;

    const position = getPos();

    if (typeof position === 'number') {
      editor.commands.setNodeSelection(position);
    }
  }

  function focusEditorAfterImageNode() {
    if (typeof getPos !== 'function') return;

    const position = getPos();

    if (typeof position !== 'number') return;

    window.setTimeout(() => {
      try {
        const afterImagePosition = Math.min(
          position + node.nodeSize,
          editor.state.doc.content.size
        );
        const resolvedAfterImage = editor.state.doc.resolve(afterImagePosition);
        const nextNode = resolvedAfterImage.nodeAfter;

        if (!nextNode || !nextNode.isTextblock) {
          editor.commands.insertContentAt(afterImagePosition, {
            type: 'paragraph',
          });
        }

        const cursorPosition = Math.min(
          afterImagePosition + 1,
          editor.state.doc.content.size
        );

        editor.chain().focus().setTextSelection(cursorPosition).run();
      } catch {
        editor.commands.focus();
      }
    }, 0);
  }

  function stopToolbarMouseDown(event: ReactMouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  function resetCrop() {
    updateAttributes({
      cropTop: '0',
      cropRight: '0',
      cropBottom: '0',
      cropLeft: '0',
    });
  }

  function alignImage(nextAlign: ImageAlignMode) {
    setCropMode(false);
    setDragEnabled(false);
    updateAttributes({
      imageAlign: nextAlign,
      imageX: nextAlign === 'free' ? String(imageX) : '0',
      imageY: nextAlign === 'free' ? String(imageY) : '0',
    });

    if (nextAlign === 'free') {
      setShowImageControls(true);
      return;
    }

    setShowImageControls(false);
    focusEditorAfterImageNode();
  }

  function handleDragStart(event: ReactMouseEvent<HTMLDivElement>) {
    const eventTarget = event.target as HTMLElement;

    if (!dragEnabled) return;
    if (eventTarget.closest('[data-image-node-control="true"]')) return;

    event.preventDefault();
    event.stopPropagation();
    setShowImageControls(true);
    selectImageNode();

    const wrapperElement = imageWrapperRef.current;
    const editorElement = wrapperElement?.closest('.ProseMirror') as HTMLElement | null;

    if (!wrapperElement || !editorElement) return;

    const wrapperRect = wrapperElement.getBoundingClientRect();
    const editorRect = editorElement.getBoundingClientRect();
    const startImageX =
      imageAlign === 'free'
        ? imageX
        : wrapperRect.left - editorRect.left + editorElement.scrollLeft;
    const startImageY =
      imageAlign === 'free'
        ? imageY
        : wrapperRect.top - editorRect.top + editorElement.scrollTop;

    setIsDragging(true);
    setDragPosition({ x: startImageX, y: startImageY });

    const startMouseX = event.clientX;
    const startMouseY = event.clientY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();

      const nextX = Math.max(0, startImageX + moveEvent.clientX - startMouseX);
      const nextY = Math.max(0, startImageY + moveEvent.clientY - startMouseY);

      setDragPosition({ x: nextX, y: nextY });
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const nextX = Math.max(0, startImageX + upEvent.clientX - startMouseX);
      const nextY = Math.max(0, startImageY + upEvent.clientY - startMouseY);

      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      setIsDragging(false);
      setDragPosition(null);

      updateAttributes({
        imageAlign: 'free',
        imageX: String(Math.round(nextX)),
        imageY: String(Math.round(nextY)),
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function startCropDrag(
    edge: 'top' | 'right' | 'bottom' | 'left',
    event: ReactMouseEvent<HTMLSpanElement>
  ) {
    event.preventDefault();
    event.stopPropagation();
    setShowImageControls(true);
    selectImageNode();

    const wrapperElement = imageWrapperRef.current;
    const rect = wrapperElement?.getBoundingClientRect();

    if (!rect) return;

    const startMouseX = event.clientX;
    const startMouseY = event.clientY;
    const startCropTop = cropTop;
    const startCropRight = cropRight;
    const startCropBottom = cropBottom;
    const startCropLeft = cropLeft;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();

      const deltaXPercent = rect.width
        ? ((moveEvent.clientX - startMouseX) / rect.width) * visibleCropWidthPercent
        : 0;
      const deltaYPercent = rect.height
        ? ((moveEvent.clientY - startMouseY) / rect.height) * visibleCropHeightPercent
        : 0;

      let nextTop = startCropTop;
      let nextRight = startCropRight;
      let nextBottom = startCropBottom;
      let nextLeft = startCropLeft;

      if (edge === 'top') {
        nextTop = clampNumber(startCropTop + deltaYPercent, 0, 80 - nextBottom);
      }

      if (edge === 'bottom') {
        nextBottom = clampNumber(startCropBottom - deltaYPercent, 0, 80 - nextTop);
      }

      if (edge === 'left') {
        nextLeft = clampNumber(startCropLeft + deltaXPercent, 0, 80 - nextRight);
      }

      if (edge === 'right') {
        nextRight = clampNumber(startCropRight - deltaXPercent, 0, 80 - nextLeft);
      }

      updateAttributes({
        cropTop: String(Math.round(nextTop * 10) / 10),
        cropRight: String(Math.round(nextRight * 10) / 10),
        cropBottom: String(Math.round(nextBottom * 10) / 10),
        cropLeft: String(Math.round(nextLeft * 10) / 10),
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  const layoutStyle = getImageNodeViewLayoutStyle(
    croppedLayoutWidth,
    imageAlign,
    imageX,
    imageY,
    imageControlsVisible,
    dragPosition
  );

  const cropViewportStyle: CSSProperties = {
    width: '100%',
    maxWidth: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '14px',
    lineHeight: 0,
    aspectRatio: imageNaturalSize
      ? `${imageNaturalSize.width * visibleCropWidthPercent} / ${imageNaturalSize.height * visibleCropHeightPercent}`
      : '16 / 9',
  };

  const imageStyle: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: `${10000 / visibleCropWidthPercent}%`,
    maxWidth: 'none',
    height: 'auto',
    borderRadius: '14px',
    transform: `translate(-${cropLeft}%, -${cropTop}%)`,
  };

  const wrapperClassName = [
    styles.imageNodeView,
    imageControlsVisible ? styles.imageNodeViewSelected : '',
    cropMode ? styles.imageNodeViewCropMode : '',
    dragEnabled ? styles.imageNodeViewDragMode : '',
    isDragging ? styles.imageNodeViewDragging : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <NodeViewWrapper
      as="div"
      ref={imageWrapperRef}
      className={wrapperClassName}
      style={layoutStyle}
      data-image-node-view="true"
      data-image-align={imageAlign}
      data-image-controls-visible={imageControlsVisible ? 'true' : 'false'}
      data-drag-enabled={dragEnabled ? 'true' : 'false'}
      contentEditable={false}
      draggable={false}
      onClick={(event: import('react').MouseEvent<HTMLDivElement>) => {
        const eventTarget = event.target as HTMLElement;

        if (eventTarget.closest('[data-image-node-control="true"]')) return;

        event.preventDefault();
        event.stopPropagation();
        setShowImageControls(true);
        selectImageNode();
      }}
      onMouseDown={handleDragStart}
    >
      {imageControlsVisible && (
        <div className={styles.imageFloatingToolbar} data-image-node-control="true">
          <button
            type="button"
            className={cropMode ? styles.imageFloatingToolActive : styles.imageFloatingTool}
            onMouseDown={stopToolbarMouseDown}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setCropMode((current) => !current);
            }}
            title="Crop Image"
          >
            <Minimize2 />
            Crop
          </button>

          <button
            type="button"
            className={dragEnabled ? styles.imageFloatingToolActive : styles.imageFloatingTool}
            onMouseDown={stopToolbarMouseDown}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setDragEnabled((current) => !current);
              setCropMode(false);
            }}
            title="Drag Image Anywhere"
          >
            <MousePointer2 />
            Drag
          </button>

          <button
            type="button"
            className={imageAlign === 'left' ? styles.imageFloatingToolActive : styles.imageFloatingTool}
            onMouseDown={stopToolbarMouseDown}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              alignImage('left');
            }}
            title="Align Left"
          >
            <AlignLeft />
          </button>

          <button
            type="button"
            className={imageAlign === 'center' ? styles.imageFloatingToolActive : styles.imageFloatingTool}
            onMouseDown={stopToolbarMouseDown}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              alignImage('center');
            }}
            title="Align Center"
          >
            <AlignCenter />
          </button>

          <button
            type="button"
            className={imageAlign === 'right' ? styles.imageFloatingToolActive : styles.imageFloatingTool}
            onMouseDown={stopToolbarMouseDown}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              alignImage('right');
            }}
            title="Align Right"
          >
            <AlignRight />
          </button>

          <button
            type="button"
            className={imageAlign === 'float-left' ? styles.imageFloatingToolActive : styles.imageFloatingTool}
            onMouseDown={stopToolbarMouseDown}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              alignImage('float-left');
            }}
            title="Wrap Text Left"
          >
            <WrapText />
            Wrap Left
          </button>

          <button
            type="button"
            className={imageAlign === 'float-right' ? styles.imageFloatingToolActive : styles.imageFloatingTool}
            onMouseDown={stopToolbarMouseDown}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              alignImage('float-right');
            }}
            title="Wrap Text Right"
          >
            <WrapText />
            Wrap Right
          </button>

          <button
            type="button"
            className={styles.imageFloatingDangerTool}
            onMouseDown={stopToolbarMouseDown}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              deleteNode();
            }}
            title="Delete Image"
          >
            <Trash2 />
            Delete
          </button>
        </div>
      )}

      <div
        className={styles.imageCropViewport}
        style={cropViewportStyle}
        data-image-crop-viewport="true"
      >
        <img
          src={attrs.src || ''}
          alt={attrs.alt || ''}
          title={attrs.title || attrs.alt || ''}
          style={imageStyle}
          draggable={false}
          onLoad={(event: import('react').SyntheticEvent<HTMLImageElement>) => {
            const imageElement = event.currentTarget;
            const naturalWidth = imageElement.naturalWidth;
            const naturalHeight = imageElement.naturalHeight;

            if (naturalWidth && naturalHeight) {
              setImageNaturalSize({
                width: naturalWidth,
                height: naturalHeight,
              });

              if (
                String(attrs.imageNaturalWidth || '') !== String(naturalWidth) ||
                String(attrs.imageNaturalHeight || '') !== String(naturalHeight)
              ) {
                updateAttributes({
                  imageNaturalWidth: String(naturalWidth),
                  imageNaturalHeight: String(naturalHeight),
                });
              }
            }
          }}
        />
      </div>

      {imageControlsVisible && cropMode && (
        <>
          <span
            className={`${styles.imageCropHandle} ${styles.imageCropHandleTop}`}
            data-image-node-control="true"
            onMouseDown={(event) => startCropDrag('top', event)}
          />
          <span
            className={`${styles.imageCropHandle} ${styles.imageCropHandleRight}`}
            data-image-node-control="true"
            onMouseDown={(event) => startCropDrag('right', event)}
          />
          <span
            className={`${styles.imageCropHandle} ${styles.imageCropHandleBottom}`}
            data-image-node-control="true"
            onMouseDown={(event) => startCropDrag('bottom', event)}
          />
          <span
            className={`${styles.imageCropHandle} ${styles.imageCropHandleLeft}`}
            data-image-node-control="true"
            onMouseDown={(event) => startCropDrag('left', event)}
          />

          <button
            type="button"
            className={styles.imageCropResetButton}
            data-image-node-control="true"
            onMouseDown={stopToolbarMouseDown}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              resetCrop();
            }}
          >
            Reset crop
          </button>
        </>
      )}
    </NodeViewWrapper>
  );
}

const RichImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...(this.parent?.() || {}),
      width: {
        default: '60%',
        parseHTML: (element) => {
          return (
            element.getAttribute('data-image-width') ||
            element.style.width ||
            '60%'
          );
        },
        renderHTML: (attributes) => {
          return {
            'data-image-width': attributes.width || '60%',
          };
        },
      },
      imageAlign: {
        default: 'center',
        parseHTML: (element) => {
          return element.getAttribute('data-image-align') || 'center';
        },
        renderHTML: (attributes) => {
          return {
            'data-image-align': attributes.imageAlign || 'center',
            style: buildImageLayoutStyle(
              attributes.width || '60%',
              attributes.imageAlign || 'center',
              attributes.imageX || '0',
              attributes.imageY || '0',
              {
                top: attributes.cropTop || '0',
                right: attributes.cropRight || '0',
                bottom: attributes.cropBottom || '0',
                left: attributes.cropLeft || '0',
              }
            ),
          };
        },
      },
      imageX: {
        default: '0',
        parseHTML: (element) => element.getAttribute('data-image-x') || '0',
        renderHTML: (attributes) => ({
          'data-image-x': attributes.imageX || '0',
        }),
      },
      imageY: {
        default: '0',
        parseHTML: (element) => element.getAttribute('data-image-y') || '0',
        renderHTML: (attributes) => ({
          'data-image-y': attributes.imageY || '0',
        }),
      },
      cropTop: {
        default: '0',
        parseHTML: (element) => element.getAttribute('data-image-crop-top') || '0',
        renderHTML: (attributes) => ({
          'data-image-crop-top': attributes.cropTop || '0',
        }),
      },
      cropRight: {
        default: '0',
        parseHTML: (element) => element.getAttribute('data-image-crop-right') || '0',
        renderHTML: (attributes) => ({
          'data-image-crop-right': attributes.cropRight || '0',
        }),
      },
      cropBottom: {
        default: '0',
        parseHTML: (element) => element.getAttribute('data-image-crop-bottom') || '0',
        renderHTML: (attributes) => ({
          'data-image-crop-bottom': attributes.cropBottom || '0',
        }),
      },
      cropLeft: {
        default: '0',
        parseHTML: (element) => element.getAttribute('data-image-crop-left') || '0',
        renderHTML: (attributes) => ({
          'data-image-crop-left': attributes.cropLeft || '0',
        }),
      },
      imageNaturalWidth: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-image-natural-width'),
        renderHTML: (attributes) => {
          if (!attributes.imageNaturalWidth) return {};

          return {
            'data-image-natural-width': attributes.imageNaturalWidth,
          };
        },
      },
      imageNaturalHeight: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-image-natural-height'),
        renderHTML: (attributes) => {
          if (!attributes.imageNaturalHeight) return {};

          return {
            'data-image-natural-height': attributes.imageNaturalHeight,
          };
        },
      },
      chartPreviewTable: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-chart-preview-table'),
        renderHTML: (attributes) => {
          if (!attributes.chartPreviewTable) return {};

          return {
            'data-chart-preview-table': attributes.chartPreviewTable,
          };
        },
      },
      smartArtPreviewTable: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-smartart-preview-table'),
        renderHTML: (attributes) => {
          if (!attributes.smartArtPreviewTable) return {};

          return {
            'data-smartart-preview-table': attributes.smartArtPreviewTable,
          };
        },
      },
      insertObjectPreviewTable: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-insert-object-preview-table'),
        renderHTML: (attributes) => {
          if (!attributes.insertObjectPreviewTable) return {};

          return {
            'data-insert-object-preview-table': attributes.insertObjectPreviewTable,
          };
        },
      },
      chartType: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-chart-type'),
        renderHTML: (attributes) => {
          if (!attributes.chartType) return {};

          return {
            'data-chart-type': attributes.chartType,
          };
        },
      },
      smartArtType: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-smartart-type'),
        renderHTML: (attributes) => {
          if (!attributes.smartArtType) return {};

          return {
            'data-smartart-type': attributes.smartArtType,
          };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(InteractiveImageNodeView);
  },
});

const DynamicInsertTable = Table.extend({
  addAttributes() {
    return {
      ...(this.parent?.() || {}),
      chartDataTable: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-chart-data-table'),
        renderHTML: (attributes) => {
          if (!attributes.chartDataTable) return {};

          return {
            'data-chart-data-table': attributes.chartDataTable,
          };
        },
      },
      chartTableType: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-chart-table-type'),
        renderHTML: (attributes) => {
          if (!attributes.chartTableType) return {};

          return {
            'data-chart-table-type': attributes.chartTableType,
          };
        },
      },
      smartArtDataTable: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-smartart-data-table'),
        renderHTML: (attributes) => {
          if (!attributes.smartArtDataTable) return {};

          return {
            'data-smartart-data-table': attributes.smartArtDataTable,
          };
        },
      },
      smartArtTableType: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-smartart-table-type'),
        renderHTML: (attributes) => {
          if (!attributes.smartArtTableType) return {};

          return {
            'data-smartart-table-type': attributes.smartArtTableType,
          };
        },
      },
      insertObjectDataTable: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-insert-object-data-table'),
        renderHTML: (attributes) => {
          if (!attributes.insertObjectDataTable) return {};

          return {
            'data-insert-object-data-table': attributes.insertObjectDataTable,
          };
        },
      },
      signatureTemplate: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-signature-template'),
        renderHTML: (attributes) => {
          if (!attributes.signatureTemplate) return {};

          return {
            'data-signature-template': attributes.signatureTemplate,
          };
        },
      },
    };
  },
});

function convertLegacyInlineTags(value: string) {
  return value
    .replace(/\[font=([^\]]+)\]([\s\S]*?)\[\/font\]/g, (_match, font, text) => {
      return `<span style="font-family: ${escapeHtml(String(font))};">${text}</span>`;
    })
    .replace(/\[size=([0-9]+)\]([\s\S]*?)\[\/size\]/g, (_match, size, text) => {
      return `<span style="font-size: ${escapeHtml(String(size))}px;">${text}</span>`;
    })
    .replace(/\[color=(#[0-9a-fA-F]{6})\]([\s\S]*?)\[\/color\]/g, (_match, color, text) => {
      return `<span style="color: ${escapeHtml(String(color))};">${text}</span>`;
    })
    .replace(/\[highlight=(#[0-9a-fA-F]{6})\]([\s\S]*?)\[\/highlight\]/g, (_match, color, text) => {
      return `<mark style="background-color: ${escapeHtml(String(color))};">${text}</mark>`;
    })
    .replace(/\[co=([^\]]+)\]([\s\S]*?)\[\/co\]/g, (_match, code, text) => {
      return `<strong>${escapeHtml(String(code))}:</strong> ${text}`;
    })
    .replace(/\[skill=([^\]]+)\]([\s\S]*?)\[\/skill\]/g, (_match, skill, text) => {
      return `<strong>${escapeHtml(String(skill))}:</strong> ${text}`;
    })
    .replace(/\[reference\]([\s\S]*?)\[\/reference\]/g, (_match, text) => {
      return `<blockquote><p><strong>Reference:</strong> ${text}</p></blockquote>`;
    })
    .replace(/\[note\]([\s\S]*?)\[\/note\]/g, (_match, text) => {
      return `<blockquote><p><strong>Academic Note:</strong> ${text}</p></blockquote>`;
    })
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\+\+(.*?)\+\+/g, '<u>$1</u>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/~~(.*?)~~/g, '<s>$1</s>');
}

function markdownLikeTextToHtml(value: string) {
  if (!value.trim()) return '<p></p>';

  const lines = value.split('\n');

  let html = '';
  let index = 0;
  let openList: 'ul' | 'ol' | null = null;
  let isInsideCodeBlock = false;
  let codeContent = '';

  function closeList() {
    if (!openList) return;
    html += `</${openList}>`;
    openList = null;
  }

  function openListIfNeeded(type: 'ul' | 'ol') {
    if (openList === type) return;
    closeList();
    html += `<${type}>`;
    openList = type;
  }

  function isTableSeparator(line: string) {
    return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  }

  function parseTable(startIndex: number) {
    const tableLines: string[] = [];
    let currentIndex = startIndex;

    while (
      currentIndex < lines.length &&
      lines[currentIndex].includes('|') &&
      lines[currentIndex].trim()
    ) {
      tableLines.push(lines[currentIndex]);
      currentIndex += 1;
    }

    if (tableLines.length < 2) {
      return {
        html: `<p>${escapeHtml(lines[startIndex])}</p>`,
        nextIndex: startIndex + 1,
      };
    }

    const headers = tableLines[0]
      .split('|')
      .map((cell) => cell.trim())
      .filter(Boolean);

    const rows = tableLines.slice(2).map((row) =>
      row
        .split('|')
        .map((cell) => cell.trim())
        .filter(Boolean)
    );

    const headerHtml = headers
      .map((header) => `<th>${convertLegacyInlineTags(escapeHtml(header))}</th>`)
      .join('');

    const rowsHtml = rows
      .map((row) => {
        const cells = row
          .map((cell) => `<td>${convertLegacyInlineTags(escapeHtml(cell))}</td>`)
          .join('');

        return `<tr>${cells}</tr>`;
      })
      .join('');

    return {
      html: `<table><tbody><tr>${headerHtml}</tr>${rowsHtml}</tbody></table>`,
      nextIndex: currentIndex,
    };
  }

  while (index < lines.length) {
    const rawLine = lines[index];
    const trimmedLine = rawLine.trim();

    if (
      trimmedLine.includes('|') &&
      lines[index + 1] &&
      isTableSeparator(lines[index + 1])
    ) {
      closeList();
      const parsedTable = parseTable(index);
      html += parsedTable.html;
      index = parsedTable.nextIndex;
      continue;
    }

    if (trimmedLine.startsWith('```')) {
      closeList();

      if (isInsideCodeBlock) {
        html += `<pre><code>${escapeHtml(codeContent)}</code></pre>`;
        codeContent = '';
        isInsideCodeBlock = false;
      } else {
        isInsideCodeBlock = true;
      }

      index += 1;
      continue;
    }

    if (isInsideCodeBlock) {
      codeContent += `${rawLine}\n`;
      index += 1;
      continue;
    }

    if (!trimmedLine) {
      closeList();
      html += '<p></p>';
      index += 1;
      continue;
    }

    const alignMatch = trimmedLine.match(
      /^\[align=(left|center|right|justify)\]([\s\S]*?)\[\/align\]$/
    );

    if (alignMatch) {
      closeList();

      const innerText = alignMatch[2];
      const headingMatch = innerText.match(/^(#{1,6})\s+(.*)$/);

      if (headingMatch) {
        const level = headingMatch[1].length;

        html += `<h${level} style="text-align: ${alignMatch[1]};">${convertLegacyInlineTags(
          escapeHtml(headingMatch[2])
        )}</h${level}>`;
      } else {
        html += `<p style="text-align: ${alignMatch[1]};">${convertLegacyInlineTags(
          escapeHtml(innerText)
        )}</p>`;
      }

      index += 1;
      continue;
    }

    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.*)$/);

    if (headingMatch) {
      closeList();

      const level = headingMatch[1].length;

      html += `<h${level}>${convertLegacyInlineTags(escapeHtml(headingMatch[2]))}</h${level}>`;
      index += 1;
      continue;
    }

    if (/^[-*•◦▪→✓★◆]\s+/.test(trimmedLine)) {
      openListIfNeeded('ul');

      html += `<li>${convertLegacyInlineTags(
        escapeHtml(trimmedLine.replace(/^[-*•◦▪→✓★◆]\s+/, ''))
      )}</li>`;

      index += 1;
      continue;
    }

    if (
      /^\d+\.\s+/.test(trimmedLine) ||
      /^[a-zA-Z]\.\s+/.test(trimmedLine) ||
      /^(i|ii|iii|iv|v|vi|vii|viii|ix|x)\.\s+/i.test(trimmedLine)
    ) {
      openListIfNeeded('ol');

      html += `<li>${convertLegacyInlineTags(
        escapeHtml(
          trimmedLine
            .replace(/^\d+\.\s+/, '')
            .replace(/^[a-zA-Z]\.\s+/, '')
            .replace(/^(i|ii|iii|iv|v|vi|vii|viii|ix|x)\.\s+/i, '')
        )
      )}</li>`;

      index += 1;
      continue;
    }

    if (trimmedLine.startsWith('> ')) {
      closeList();

      html += `<blockquote><p>${convertLegacyInlineTags(
        escapeHtml(trimmedLine.replace(/^>\s+/, ''))
      )}</p></blockquote>`;

      index += 1;
      continue;
    }

    closeList();

    html += `<p>${convertLegacyInlineTags(escapeHtml(rawLine))}</p>`;
    index += 1;
  }

  closeList();

  if (isInsideCodeBlock && codeContent) {
    html += `<pre><code>${escapeHtml(codeContent)}</code></pre>`;
  }

  return html || '<p></p>';
}


function removeTextBoxCalloutsFromHtml(html: string) {
  if (!html) return '';

  let cleanedHtml = html;

  cleanedHtml = cleanedHtml.replace(
    /<(div|blockquote)\b([^>]*\s)?data-text-box-callout=["']true["'][^>]*>([\s\S]*?)<\/\1>/gi,
    (_match, _tag, _attrs, innerContent) => {
      const safeInnerContent = String(innerContent || '').trim();

      return safeInnerContent || '<p></p>';
    }
  );

  cleanedHtml = cleanedHtml
    .replace(/\sdata-text-box-callout=["']true["']/gi, '')
    .replace(/\sdata-text-box-actions-visible=["'][^"']*["']/gi, '')
    .replace(/\sdata-text-box-content=["']true["']/gi, '')
    .replace(/\sdata-text-box-saved=["'][^"']*["']/gi, '');

  return cleanedHtml;
}

function getInitialHtml(value?: AppTextEditorValue) {
  const safeHtml = removeTextBoxCalloutsFromHtml(value?.html || '');
  const safePlainText = value?.plain_text || '';

  if (
    safeHtml &&
    !safeHtml.includes('[align=') &&
    !safeHtml.includes('[font=')
  ) {
    return safeHtml;
  }

  if (safePlainText) return markdownLikeTextToHtml(safePlainText);
  if (safeHtml) return markdownLikeTextToHtml(safeHtml);

  return '<p></p>';
}

function getSafeEditorValue(value?: AppTextEditorValue) {
  return {
    html: removeTextBoxCalloutsFromHtml(value?.html || ''),
    plain_text: value?.plain_text || '',
    json_content: value?.json_content || null,
  };
}

function calculateEditorStats(value: string) {
  const trimmedValue = value.trim();

  const characters = value.length;
  const words = trimmedValue
    ? trimmedValue.split(/\s+/).filter(Boolean).length
    : 0;
  const lines = value ? Math.max(1, value.split('\n').length) : 1;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  return {
    characters,
    words,
    lines,
    readingTime,
  };
}

function getEditorPlainText(editorInstance: TiptapEditor) {
  return editorInstance.getText({
    blockSeparator: '\n',
  });
}

function buildAcademicTemplate(
  type: AcademicTemplateType,
  context?: AiEditorContext,
  courseOutcomes: CourseOutcomeOption[] = []
) {
  const courseTitle = context?.courseTitle || '[Course Title]';
  const courseCode = context?.courseCode || '[Course Code]';
  const programmeName = context?.programmeName || '[Programme]';
  const semester = context?.semester || '[Semester]';

  const outcomeRows =
    courseOutcomes.length > 0
      ? courseOutcomes
          .map((co) => {
            return `<tr><td>${escapeHtml(co.code)}</td><td>${escapeHtml(
              co.title || 'Outcome statement'
            )}</td><td>Unit / Topic</td><td>Assessment Method</td></tr>`;
          })
          .join('')
      : `
        <tr><td>CO1</td><td>Describe the core concepts of the course.</td><td>Unit 1</td><td>Quiz / Assignment</td></tr>
        <tr><td>CO2</td><td>Apply the concepts to solve academic or practical problems.</td><td>Unit 2</td><td>Project / Practical</td></tr>
      `;

  const templates: Record<AcademicTemplateType, string> = {
    course_overview: `
      <h2>Course Overview</h2>
      <p><strong>Course Title:</strong> ${escapeHtml(courseTitle)}</p>
      <p><strong>Course Code:</strong> ${escapeHtml(courseCode)}</p>
      <p><strong>Programme:</strong> ${escapeHtml(programmeName)}</p>
      <p><strong>Semester:</strong> ${escapeHtml(semester)}</p>
      <h3>Course Description</h3>
      <p>Write a concise academic description of the course, its scope, and its relevance to the programme.</p>
      <h3>Course Objectives</h3>
      <ul>
        <li>Introduce the core concepts and terminology of the subject.</li>
        <li>Develop analytical, practical, and problem-solving skills.</li>
        <li>Connect the course content with programme outcomes and employability skills.</li>
      </ul>
    `,
    syllabus_unit_wise: buildSyllabusDraftTableTemplate(
      'unit_wise',
      context
    ),
    syllabus_module_wise: buildSyllabusDraftTableTemplate(
      'module_wise',
      context
    ),
    syllabus_chapter_wise: buildSyllabusDraftTableTemplate(
      'chapter_wise',
      context
    ),
    syllabus_topic_wise: buildSyllabusDraftTableTemplate(
      'topic_wise',
      context
    ),
    syllabus_custom: buildSyllabusDraftTableTemplate(
      'custom',
      context
    ),
    unit_plan: `
      <h2>Unit Plan</h2>
      <table>
        <tbody>
          <tr>
            <th>Unit</th>
            <th>Title</th>
            <th>Topics / Subtopics</th>
            <th>Hours</th>
            <th>Mapped COs</th>
          </tr>
          <tr>
            <td>Unit 1</td>
            <td>Introduction</td>
            <td>Core concepts, definitions, and foundations</td>
            <td>6</td>
            <td>CO1</td>
          </tr>
          <tr>
            <td>Unit 2</td>
            <td>Application</td>
            <td>Applied concepts, examples, and practice</td>
            <td>8</td>
            <td>CO2</td>
          </tr>
        </tbody>
      </table>
    `,
    lesson_plan: `
      <h2>Lesson Plan</h2>
      <p><strong>Lesson Title:</strong> [Enter title]</p>
      <p><strong>Duration:</strong> [Enter duration]</p>
      <p><strong>Learning Outcome:</strong> [Mapped CLO / CO]</p>
      <h3>Teaching-Learning Activities</h3>
      <ol>
        <li>Opening discussion / recap.</li>
        <li>Concept explanation with examples.</li>
        <li>Guided activity or practice task.</li>
        <li>Formative assessment and reflection.</li>
      </ol>
      <h3>Resources</h3>
      <p>Textbook, digital resources, lab material, case study, or worksheet.</p>
    `,
    assessment_blueprint: `
      <h2>Assessment Blueprint</h2>
      <table>
        <tbody>
          <tr>
            <th>Assessment Type</th>
            <th>Mapped COs</th>
            <th>Bloom Level</th>
            <th>Weightage</th>
            <th>Evidence</th>
          </tr>
          <tr>
            <td>Quiz</td>
            <td>CO1</td>
            <td>Remember / Understand</td>
            <td>10%</td>
            <td>Question paper / LMS record</td>
          </tr>
          <tr>
            <td>Assignment</td>
            <td>CO2</td>
            <td>Apply / Analyze</td>
            <td>20%</td>
            <td>Submission / Rubric</td>
          </tr>
          <tr>
            <td>Project / Practical</td>
            <td>CO3</td>
            <td>Create / Evaluate</td>
            <td>30%</td>
            <td>Report / Viva / Demo</td>
          </tr>
        </tbody>
      </table>
    `,
    rubric: `
      <h2>Evaluation Rubric</h2>
      <table>
        <tbody>
          <tr>
            <th>Criterion</th>
            <th>Excellent</th>
            <th>Good</th>
            <th>Satisfactory</th>
            <th>Needs Improvement</th>
          </tr>
          <tr>
            <td>Conceptual Understanding</td>
            <td>Clear, accurate, and complete</td>
            <td>Mostly accurate</td>
            <td>Basic understanding</td>
            <td>Limited understanding</td>
          </tr>
          <tr>
            <td>Application</td>
            <td>Applies concepts independently</td>
            <td>Applies with minor gaps</td>
            <td>Applies with support</td>
            <td>Unable to apply correctly</td>
          </tr>
          <tr>
            <td>Communication</td>
            <td>Well-organized and professional</td>
            <td>Clear with minor issues</td>
            <td>Acceptable clarity</td>
            <td>Unclear or incomplete</td>
          </tr>
        </tbody>
      </table>
    `,
    clo_table: `
      <h2>Course Learning Outcome Mapping</h2>
      <table>
        <tbody>
          <tr>
            <th>CO Code</th>
            <th>Outcome Statement</th>
            <th>Mapped Unit / Topic</th>
            <th>Assessment Method</th>
          </tr>
          ${outcomeRows}
        </tbody>
      </table>
    `,
    weekly_plan: `
      <h2>Weekly Teaching Plan</h2>
      <table>
        <tbody>
          <tr>
            <th>Week</th>
            <th>Topic</th>
            <th>Teaching Method</th>
            <th>Activity / Assessment</th>
            <th>Mapped CO</th>
          </tr>
          <tr>
            <td>Week 1</td>
            <td>Introduction and foundations</td>
            <td>Lecture / Discussion</td>
            <td>Diagnostic quiz</td>
            <td>CO1</td>
          </tr>
          <tr>
            <td>Week 2</td>
            <td>Core concept development</td>
            <td>Lecture / Demonstration</td>
            <td>Worksheet</td>
            <td>CO1, CO2</td>
          </tr>
          <tr>
            <td>Week 3</td>
            <td>Application and practice</td>
            <td>Activity / Lab</td>
            <td>Assignment</td>
            <td>CO2</td>
          </tr>
        </tbody>
      </table>
    `,
    lab_record: `
      <h2>Lab / Practical Record</h2>
      <p><strong>Experiment Title:</strong> [Enter experiment title]</p>
      <p><strong>Objective:</strong> [Enter objective]</p>
      <p><strong>Tools / Software Required:</strong> [Enter tools]</p>
      <h3>Procedure</h3>
      <ol>
        <li>Set up the required environment or materials.</li>
        <li>Perform the experiment steps.</li>
        <li>Record observations and outputs.</li>
        <li>Analyze the result and submit the report.</li>
      </ol>
      <h3>Expected Outcome</h3>
      <p>Students will be able to demonstrate the selected practical competency.</p>
    `,
    reading_list: `
      <h2>Recommended Reading List</h2>
      <h3>Prescribed Textbook</h3>
      <p>[Author]. [Title]. [Publisher], [Year].</p>
      <h3>Reference Books</h3>
      <ol>
        <li>[Author]. [Title]. [Publisher], [Year].</li>
        <li>[Author]. [Title]. [Publisher], [Year].</li>
      </ol>
      <h3>Digital Resources</h3>
      <ul>
        <li>Official documentation / standards</li>
        <li>Open educational resources</li>
        <li>Institutional LMS material</li>
      </ul>
    `,
    approval_note: `
      <h2>Academic Approval Note</h2>
      <p><strong>Course:</strong> ${escapeHtml(courseTitle)} (${escapeHtml(courseCode)})</p>
      <p><strong>Programme:</strong> ${escapeHtml(programmeName)}</p>
      <p><strong>Semester:</strong> ${escapeHtml(semester)}</p>
      <h3>Review Summary</h3>
      <p>The syllabus has been reviewed for academic alignment, outcome mapping, assessment coverage, and institutional requirements.</p>
      <h3>Approval Remarks</h3>
      <p>[Enter approval or revision remarks]</p>
    `,
  };

  return templates[type];
}

function buildOfflineAcademicAiDraft(
  action: AiEditorAction,
  context?: AiEditorContext,
  activeText = '',
  targetLanguage = 'English'
) {
  const courseTitle = context?.courseTitle || '[Course Title]';
  const courseCode = context?.courseCode || '[Course Code]';
  const subjectArea = context?.subjectArea || context?.courseTitle || '[Subject Area]';
  const level = context?.level || '[Academic Level]';

  const textHint = activeText.trim()
    ? activeText.trim().slice(0, 700)
    : '[Paste or type course content before running this action for a better AI result.]';

  const drafts: Record<AiEditorAction, string> = {
    improve: `
## Refined Academic Draft

${textHint}

### Editorial Improvements to Apply
- Use measurable academic verbs.
- Keep statements concise and outcome-focused.
- Align syllabus content with course outcomes, assessment methods, and institutional standards.
- Remove ambiguous wording and replace it with observable learning actions.
    `,
    summarize: `
## Academic Abstract

This course, **${courseTitle} (${courseCode})**, introduces learners to the core concepts, methods, and applications of **${subjectArea}**. It supports conceptual understanding, practical application, and academic skill development at the **${level}** level.

### Key Focus Areas
- Foundational concepts and terminology
- Applied learning activities
- Outcome-aligned assessment
- Academic and professional skill development
    `,
    generate_outcomes: `
## AI-Suggested Course Learning Outcomes

After successful completion of this course, learners will be able to:

1. **CO1:** Describe the foundational concepts and principles of ${subjectArea}.
2. **CO2:** Apply relevant methods, tools, or procedures to solve academic or practical problems.
3. **CO3:** Analyze scenarios, datasets, cases, or problems using course-specific concepts.
4. **CO4:** Evaluate solutions, outputs, or arguments based on academic criteria.
5. **CO5:** Create a report, project, model, presentation, or practical output aligned with course objectives.
    `,
    syllabus_to_units: `
## AI-Suggested Unit Breakdown

| Unit | Title | Key Topics | Suggested Hours | Mapped COs |
| --- | --- | --- | --- | --- |
| Unit 1 | Foundations of ${subjectArea} | Definitions, scope, principles, terminology | 6 | CO1 |
| Unit 2 | Core Concepts and Methods | Major theories, procedures, or frameworks | 8 | CO1, CO2 |
| Unit 3 | Applications | Case studies, applied exercises, practice tasks | 8 | CO2, CO3 |
| Unit 4 | Analysis and Evaluation | Comparative analysis, evaluation criteria, review tasks | 6 | CO3, CO4 |
| Unit 5 | Project / Integration | Final application, report, presentation, or lab work | 8 | CO4, CO5 |
    `,
    map_skills: `
## AI-Suggested Skill Mapping

| Skill Area | Relevant Course Content | Evidence / Activity | Assessment Method |
| --- | --- | --- | --- |
| Conceptual Understanding | Core course concepts | Short answer / quiz | Quiz |
| Analytical Thinking | Case or problem analysis | Worksheet / report | Assignment |
| Practical Application | Lab, project, or simulation | Practical output | Rubric |
| Communication | Presentation or written report | Report / viva | Presentation |
| Professional Practice | Ethics, sustainability, employability | Reflection / case task | Rubric |
    `,
    generate_quiz: `
## AI-Generated Question Bank

### Multiple-Choice Questions
1. Which option best describes the core purpose of this topic?
   - A. [Option A]
   - B. [Option B]
   - C. [Option C]
   - D. [Option D]

2. Which concept is most closely related to the practical application of ${subjectArea}?
   - A. [Option A]
   - B. [Option B]
   - C. [Option C]
   - D. [Option D]

### Short-Answer Questions
1. Define two key terms related to this unit.
2. Explain one real-world application of the selected topic.
3. Describe how this topic supports the mapped course outcome.

### Higher-Order Question
1. Analyze a case scenario and justify the solution using course concepts.
    `,
    translate: `
## Translation Draft

Target language: **${targetLanguage}**

Paste the final source text here or connect this editor to an AI translation endpoint to generate a complete academic translation.

### Source Preview
${textHint}
    `,
  };

  return drafts[action];
}

function renderAiIcon(icon: 'sparkles' | 'book' | 'graduation' | 'skills' | 'quiz' | 'language') {
  if (icon === 'book') return <BookOpen size={14} />;
  if (icon === 'graduation') return <GraduationCap size={14} />;
  if (icon === 'skills') return <Tags size={14} />;
  if (icon === 'quiz') return <ListChecks size={14} />;
  if (icon === 'language') return <Languages size={14} />;

  return <Sparkles size={14} />;
}


function openSyllabusEditorFileDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(
      TEXT_EDITOR_FILE_DATABASE_NAME,
      TEXT_EDITOR_FILE_DATABASE_VERSION
    );

    request.onupgradeneeded = () => {
      const database = request.result;

      if (
        !database.objectStoreNames.contains(
          TEXT_EDITOR_FILE_STORE_NAME
        )
      ) {
        database.createObjectStore(
          TEXT_EDITOR_FILE_STORE_NAME,
          { keyPath: 'id' }
        );
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        request.error ||
          new Error(
            'Unable to open text-editor file storage.'
          )
      );
  });
}

async function readSyllabusEditorFilePayload(
  id: string
): Promise<string> {
  if (!id || typeof window === 'undefined') {
    return '';
  }

  const database =
    await openSyllabusEditorFileDatabase();

  try {
    const transaction = database.transaction(
      TEXT_EDITOR_FILE_STORE_NAME,
      'readonly'
    );

    const request = transaction
      .objectStore(TEXT_EDITOR_FILE_STORE_NAME)
      .get(id);

    return await new Promise<string>(
      (resolve, reject) => {
        request.onsuccess = () => {
          const record = request.result as
            | { fileDataUrl?: string }
            | undefined;

          resolve(record?.fileDataUrl || '');
        };

        request.onerror = () =>
          reject(
            request.error ||
              new Error(
                'Unable to read the uploaded editor file.'
              )
          );
      }
    );
  } finally {
    database.close();
  }
}

async function saveSyllabusEditorFilePayload(
  id: string,
  fileDataUrl: string
) {
  if (
    !id ||
    !fileDataUrl ||
    typeof window === 'undefined'
  ) {
    return;
  }

  const database =
    await openSyllabusEditorFileDatabase();

  try {
    const transaction = database.transaction(
      TEXT_EDITOR_FILE_STORE_NAME,
      'readwrite'
    );

    transaction
      .objectStore(TEXT_EDITOR_FILE_STORE_NAME)
      .put({
        id,
        fileDataUrl,
        savedAt: new Date().toISOString(),
      });

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(
          transaction.error ||
            new Error(
              'Unable to save the edited file.'
            )
        );
      transaction.onabort = () =>
        reject(
          transaction.error ||
            new Error(
              'Saving the edited file was cancelled.'
            )
        );
    });
  } finally {
    database.close();
  }
}

function dataUrlToFile(
  dataUrl: string,
  fileName: string,
  fallbackMimeType = 'application/octet-stream'
) {
  const normalizedDataUrl =
    typeof dataUrl === 'string'
      ? dataUrl.trim()
      : '';

  const commaIndex =
    normalizedDataUrl.indexOf(',');

  if (
    !normalizedDataUrl.startsWith('data:') ||
    commaIndex < 0
  ) {
    throw new Error(
      'The uploaded document data is unavailable.'
    );
  }

  const header =
    normalizedDataUrl.slice(0, commaIndex);

  const body =
    normalizedDataUrl.slice(commaIndex + 1);
  const mimeMatch = header.match(/^data:([^;,]+)/);
  const mimeType =
    mimeMatch?.[1] || fallbackMimeType;
  const isBase64 = /;base64/i.test(header);

  const binary = isBase64
    ? window.atob(body)
    : decodeURIComponent(body);

  const bytes = new Uint8Array(binary.length);

  for (
    let index = 0;
    index < binary.length;
    index += 1
  ) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, {
    type: mimeType,
  });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () =>
      resolve(
        typeof reader.result === 'string'
          ? reader.result
          : ''
      );

    reader.onerror = () =>
      reject(
        reader.error ||
          new Error(
            'Unable to prepare the edited file.'
          )
      );

    reader.readAsDataURL(blob);
  });
}

function formatGeneratedFileSize(size: number) {
  if (size < 1024) return `${size} B`;

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function getRequestedEditorOutputFormat(
  request: SyllabusBuilderEditorRequest
): 'docx' | 'txt' | 'pdf' {
  if (request.requestedOutputFormat) {
    return request.requestedOutputFormat;
  }

  const extension = (
    request.fileName?.split('.').pop() || ''
  ).toLowerCase();

  if (extension === 'pdf') return 'pdf';

  if (
    extension === 'doc' ||
    extension === 'docx'
  ) {
    return 'docx';
  }

  return 'txt';
}

function replaceFileExtension(
  fileName: string,
  extension: 'docx' | 'txt' | 'pdf'
) {
  const baseName = (
    fileName ||
    'Edited Document'
  ).replace(/\.[^.]+$/, '');

  return `${baseName}.${extension}`;
}

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, '?');
}

function wrapPdfText(
  value: string,
  maxCharacters = 88
) {
  const lines: string[] = [];

  value
    .replace(/\r/g, '')
    .split('\n')
    .forEach((paragraph) => {
      const words = paragraph
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .filter(Boolean);

      if (words.length === 0) {
        lines.push('');
        return;
      }

      let currentLine = '';

      words.forEach((word) => {
        const candidate = currentLine
          ? `${currentLine} ${word}`
          : word;

        if (
          candidate.length > maxCharacters &&
          currentLine
        ) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = candidate;
        }
      });

      if (currentLine) {
        lines.push(currentLine);
      }
    });

  return lines;
}

function createSimplePdfBlob(plainText: string) {
  const lines = wrapPdfText(plainText || ' ');
  const linesPerPage = 48;
  const pages: string[][] = [];

  for (
    let index = 0;
    index < lines.length;
    index += linesPerPage
  ) {
    pages.push(
      lines.slice(index, index + linesPerPage)
    );
  }

  if (pages.length === 0) pages.push(['']);

  const objects: string[] = [];
  const pageNumbers: number[] = [];
  const streamNumbers: number[] = [];

  pages.forEach((_, index) => {
    pageNumbers.push(4 + index * 2);
    streamNumbers.push(5 + index * 2);
  });

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] =
    `<< /Type /Pages /Kids [${pageNumbers
      .map((number) => `${number} 0 R`)
      .join(' ')}] /Count ${pages.length} >>`;
  objects[3] =
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

  pages.forEach((pageLines, index) => {
    objects[pageNumbers[index]] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamNumbers[index]} 0 R >>`;

    const commands = [
      'BT',
      '/F1 11 Tf',
      '54 790 Td',
    ];

    pageLines.forEach((line, lineIndex) => {
      if (lineIndex > 0) {
        commands.push('0 -15 Td');
      }

      commands.push(
        `(${escapePdfText(line)}) Tj`
      );
    });

    commands.push('ET');
    const stream = commands.join('\n');

    objects[streamNumbers[index]] =
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  const maxObject = objects.length - 1;

  for (
    let objectNumber = 1;
    objectNumber <= maxObject;
    objectNumber += 1
  ) {
    offsets[objectNumber] = pdf.length;
    pdf += `${objectNumber} 0 obj\n${objects[objectNumber]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${maxObject + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (
    let objectNumber = 1;
    objectNumber <= maxObject;
    objectNumber += 1
  ) {
    pdf += `${String(offsets[objectNumber]).padStart(
      10,
      '0'
    )} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${maxObject + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], {
    type: 'application/pdf',
  });
}

function createWordCompatibleBlob(
  title: string,
  html: string
) {
  const documentHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
body {
  font-family: Aptos, Calibri, Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.5;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid #cbd5e1;
  padding: 6px 8px;
}
img {
  max-width: 100%;
  height: auto;
}
</style>
</head>
<body>${html || '<p></p>'}</body>
</html>`;

  return new Blob([documentHtml], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

export default function AppTextEditor({
  id,
  label,
  value,
  onChange,
  defaultValue = emptyEditorValue,
  placeholder = 'Start typing...',
  required = false,
  error,
  helpText,
  minRows = 8,
  fullEditorHref,
  disabled = false,
  showPreview = true,
  defaultMode = 'write',
  allowFullscreen = true,
  maxLength,
  enableAutosave = false,
  storageKey,
  autosaveDelayMs = 800,
  onAutosave,
  enableUniversityTools = true,
  enableAiTools = true,
  enableFormulaTools = true,
  enableImageUpload = true,
  enableVersionHistory = true,
  enableComments = true,
  enableApprovalRemarks = true,
  courseOutcomes = [],
  skillTags = [],
  onImageUpload,
  onExportPdf,
  onAiAction,
  aiEndpoint = '/api/ai/editor',
  aiContext,
  targetLanguage = 'English',
  onApprovalRemarkChange,
}: AppTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const documentImportInputRef = useRef<HTMLInputElement | null>(null);
  const tocImportInputRef = useRef<HTMLInputElement | null>(null);
  const autosaveFirstRenderRef = useRef(true);
  const insertVisualSyncRef = useRef(false);
  const toolbarScrollRef = useRef<HTMLDivElement | null>(null);
  const toolbarScrollLeftRef = useRef(0);
  const toolbarScrollRestoreFrameRef = useRef<number | null>(null);
  const toolbarScrollFreezeUntilRef = useRef(0);
  const toolbarScrollReleaseTimerRef = useRef<number | null>(null);

  const [editorMode, setEditorMode] = useState<EditorMode>(
    showPreview ? defaultMode : 'write'
  );
  const [activeRibbonTab, setActiveRibbonTab] = useState<RibbonTab>('home');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isProductionFullscreen, setIsProductionFullscreen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const [comments, setComments] = useState<EditorComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [approvalRemark, setApprovalRemark] = useState('');
  const [versions, setVersions] = useState<EditorVersion[]>([]);

  const [isAiRunning, setIsAiRunning] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  const [customTextColor, setCustomTextColor] = useState('#111827');
  const [customHighlightColor, setCustomHighlightColor] = useState('#fef3c7');
  const [fontFamilyInput, setFontFamilyInput] = useState('');
  const [fontSizeInput, setFontSizeInput] = useState('');
  const [openHomeDropdown, setOpenHomeDropdown] =
    useState<HomeDropdownType>(null);
  const [homeDropdownPosition, setHomeDropdownPosition] =
    useState<HomeDropdownPosition | null>(null);
  const homeDropdownTriggerRefs = useRef<Record<HomeDropdownKey, HTMLElement | null>>({
    fontFamily: null,
    fontSize: null,
    textColor: null,
    highlightColor: null,
    paragraphPreset: null,
    lineSpacing: null,
    bulletStyle: null,
    numberStyle: null,
    textCase: null,
    chartTemplate: null,
    smartArtTemplate: null,
  });
  const [selectedTextColorValue, setSelectedTextColorValue] =
    useState('');
  const [selectedHighlightColorValue, setSelectedHighlightColorValue] =
    useState('');
  const [selectedParagraphPresetValue, setSelectedParagraphPresetValue] =
    useState('');
  const [selectedLineSpacingValue, setSelectedLineSpacingValue] =
    useState('');
  const [selectedTextCaseValue, setSelectedTextCaseValue] =
    useState('');
  const [selectedBulletStyleValue, setSelectedBulletStyleValue] =
    useState('disc');
  const [selectedNumberStyleValue, setSelectedNumberStyleValue] =
    useState('decimal');

  const [citationSources, setCitationSources] = useState<CitationSource[]>([]);
  const [editorFootnotes, setEditorFootnotes] = useState<EditorFootnote[]>([]);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [footnoteSettingsOpen, setFootnoteSettingsOpen] = useState(false);
  const [footnoteSettings, setFootnoteSettings] =
    useState<FootnoteSettings>(defaultFootnoteSettings);
  const [activeFootnoteIndex, setActiveFootnoteIndex] = useState(-1);
  const [trackChangesEnabled, setTrackChangesEnabled] = useState(false);

  const [pageMargin, setPageMargin] = useState<LayoutMarginPreset>('normal');
  const [pageOrientation, setPageOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pageSize, setPageSize] = useState<LayoutPageSizePreset>('A4');
  const [columnPreset, setColumnPreset] = useState<LayoutColumnPreset>('1');
  const [columnCount, setColumnCount] = useState(1);
  const [lineNumbers, setLineNumbers] = useState(false);
  const [hyphenation, setHyphenation] = useState(false);
  const [selectedTableOfContents, setSelectedTableOfContents] =
    useState<TableOfContentsPreset>('classicHeading');
  const [pageViewMode, setPageViewMode] = useState<LayoutPageViewPreset>('normal');
  const [selectionPaneOpen, setSelectionPaneOpen] = useState(false);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [showRuler, setShowRuler] = useState(false);
  const [showGridlines, setShowGridlines] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [isSplitSidebarHidden, setIsSplitSidebarHidden] = useState(false);

  const [insertTableRows, setInsertTableRows] = useState(3);
  const [insertTableCols, setInsertTableCols] = useState(3);
  const [selectedSmartArtTemplate, setSelectedSmartArtTemplate] =
    useState<SmartArtTemplateType>('process');
  const [selectedSmartArtCategory, setSelectedSmartArtCategory] =
    useState<SmartArtCategory>('All');
  const [isSmartArtChooserOpen, setIsSmartArtChooserOpen] = useState(false);
  const [selectedChartTemplate, setSelectedChartTemplate] =
    useState<EditableChartType>('column');
  const [selectedChartCategory, setSelectedChartCategory] =
    useState<EditableChartCategory>('Column');
  const [isChartChooserOpen, setIsChartChooserOpen] = useState(false);
  const [isOnlineVideoDialogOpen, setIsOnlineVideoDialogOpen] = useState(false);
  const [onlineVideoUrl, setOnlineVideoUrl] = useState('');
  const [onlineVideoTitle, setOnlineVideoTitle] = useState('');
  const [isEquationDialogOpen, setIsEquationDialogOpen] = useState(false);
  const [equationDialogMode, setEquationDialogMode] =
    useState<'insert' | 'edit'>('insert');
  const [equationLatex, setEquationLatex] = useState('');
  const [equationDisplayMode, setEquationDisplayMode] =
    useState<EquationDisplayMode>('block');
  const [editingEquationPos, setEditingEquationPos] = useState<number | null>(null);
  const equationTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [signaturePromptConfig, setSignaturePromptConfig] =
    useState<SignaturePromptConfig | null>(null);
  const [signaturePromptValues, setSignaturePromptValues] =
    useState<Record<string, string>>({});
  const signatureInsertPositionRef = useRef<number | null>(null);
  const lastTableCellSelectionRef = useRef<number | null>(null);
  const lastTableDomSelectionRef = useRef<TableDomSelectionSnapshot | null>(null);

  const [currentValue, setCurrentValue] = useState<AppTextEditorValue>(() => {
    return getSafeEditorValue(value || defaultValue);
  });

  const [
    syllabusBuilderRequest,
    setSyllabusBuilderRequest,
  ] = useState<SyllabusBuilderEditorRequest | null>(null);

  const syllabusBuilderRequestLoadedRef = useRef(false);

  const hasValidOnChange = typeof onChange === 'function';

  const visibleRibbonTabs = useMemo(() => {
    return ribbonTabs.filter((tab) => {
      if (tab.id === 'academic') return enableUniversityTools;
      if (tab.id === 'ai') return enableAiTools;
      return true;
    });
  }, [enableUniversityTools, enableAiTools]);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    content: getInitialHtml(value || defaultValue),
    extensions: [
      OnlineVideo,
      EditableEquation,
      BookmarkAnchor,
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Underline,
      StyledBulletList,
      StyledOrderedList,
      ListItem,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      ListKeymap,
      TextStyle,
      FontFamily,
      FontSize,
      BlockLineHeight,
      DocumentUtilityBlocks,
      ScreenPlaceholder.configure({
        placeholder: placeholder || 'Start typing...',
      }),
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      RichImage.configure({
        inline: false,
        allowBase64: true,
      }),
      DynamicInsertTable.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Mathematics.configure({
        katexOptions: {
          throwOnError: false,
        },
      }),
    ],
    editorProps: {
      attributes: {
        id,
        class: styles.proseMirrorRoot,
        'aria-label': label,
        'data-placeholder': placeholder,
        style: `min-height: ${Math.max(minRows, 4) * 28}px;`,
      },
      handleDOMEvents: {
        click: (view, event) => {
          const target = event.target as HTMLElement | null;
          const clickedAnchor = target?.closest('a[href^="#"]') as HTMLAnchorElement | null;

          if (!clickedAnchor) return false;

          const rawBookmarkId = clickedAnchor.getAttribute('href')?.slice(1) || '';

          if (!rawBookmarkId) return false;

          event.preventDefault();
          event.stopPropagation();

          let bookmarkId = rawBookmarkId;

          try {
            bookmarkId = decodeURIComponent(rawBookmarkId);
          } catch {
            bookmarkId = rawBookmarkId;
          }

          const bookmarkTarget = view.dom.ownerDocument.getElementById(bookmarkId);

          if (bookmarkTarget && view.dom.contains(bookmarkTarget)) {
            bookmarkTarget.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest',
            });

            bookmarkTarget.classList.add('bookmarkAnchorFlash');

            window.setTimeout(() => {
              bookmarkTarget.classList.remove('bookmarkAnchorFlash');
            }, 1400);
          }

          return true;
        },
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      const nextValue: AppTextEditorValue = {
        html: removeTextBoxCalloutsFromHtml(activeEditor.getHTML()),
        plain_text: getEditorPlainText(activeEditor),
        json_content: activeEditor.getJSON(),
      };

      setCurrentValue(nextValue);
      setSaveStatus('typing');

      if (hasValidOnChange) {
        onChange?.(nextValue);
      }
    },
    onSelectionUpdate: ({ editor: activeEditor }) => {
      syncHomeFontToolbarFromSelection(activeEditor);

      const { selection } = activeEditor.state;
      const { $from } = selection;

      for (let depth = $from.depth; depth > 0; depth -= 1) {
        const nodeName = $from.node(depth).type.name;

        if (nodeName === 'tableCell' || nodeName === 'tableHeader') {
          lastTableCellSelectionRef.current = selection.from;
          return;
        }
      }
    },
  });

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !editor ||
      syllabusBuilderRequestLoadedRef.current
    ) {
      return;
    }

    const activeEditor = editor;
    let isCancelled = false;

    async function loadSyllabusBuilderRequest() {
      const storedRequest =
        window.localStorage.getItem(
          TEXT_EDITOR_REQUEST_STORAGE_KEY
        );

      if (!storedRequest) return;

      try {
        const request = JSON.parse(
          storedRequest
        ) as SyllabusBuilderEditorRequest;

        if (
          request.source !== 'syllabus-builder'
        ) {
          return;
        }

        const params = new URLSearchParams(
          window.location.search
        );

        const queryRequestId =
          params.get('requestId') || '';

        if (
          queryRequestId &&
          queryRequestId !== request.requestId
        ) {
          return;
        }

        syllabusBuilderRequestLoadedRef.current =
          true;

        setSyllabusBuilderRequest(request);

        let editorHtml = request.content || '';

        if (
          request.editorMode ===
            'edit-uploaded-file'
        ) {
          const fileDataUrl =
            request.fileDataUrl ||
            (request.fileStorageKey
              ? await readSyllabusEditorFilePayload(
                  request.fileStorageKey
                )
              : '');

          const normalizedFileDataUrl =
            typeof fileDataUrl === 'string'
              ? fileDataUrl.trim()
              : '';

          const hasValidFileData =
            normalizedFileDataUrl.startsWith(
              'data:'
            ) &&
            normalizedFileDataUrl.includes(',');

          if (hasValidFileData) {
            const sourceFile = dataUrlToFile(
              normalizedFileDataUrl,
              request.fileName ||
                'Uploaded Document',
              request.mimeType
            );

            const lowerName = (
              request.fileName ||
              sourceFile.name
            ).toLowerCase();

            if (lowerName.endsWith('.docx')) {
              const docxHtml =
                await convertDocxFileToEditableHtml(
                  sourceFile
                );

              editorHtml =
                buildImportedDocumentWrapper(
                  sourceFile.name,
                  docxHtml,
                  'docx'
                );
            } else if (
              lowerName.endsWith('.pdf') ||
              sourceFile.type ===
                'application/pdf'
            ) {
              editorHtml =
                await buildPdfImportHtml(
                  sourceFile
                );
            } else if (
              lowerName.endsWith('.txt') ||
              lowerName.endsWith('.md') ||
              lowerName.endsWith('.html') ||
              lowerName.endsWith('.htm') ||
              lowerName.endsWith('.rtf') ||
              sourceFile.type.startsWith('text/')
            ) {
              editorHtml =
                buildPlainTextImportHtml(
                  sourceFile.name,
                  await sourceFile.text()
                );
            } else {
              editorHtml =
                request.content ||
                buildImportedDocumentWrapper(
                  request.fileName ||
                    'Uploaded Document',
                  '<p>This uploaded file type cannot be converted into editable content.</p>',
                  'unsupported'
                );
            }
          } else {
            editorHtml =
              request.content ||
              buildImportedDocumentWrapper(
                request.fileName ||
                  'Uploaded Document',
                `<p><strong>The original uploaded document data is unavailable.</strong></p>
                 <p>Return to the Syllabus Builder, remove this file, upload it again, and then select Edit Uploaded File.</p>`,
                'unavailable'
              );

            console.warn(
              'The uploaded document does not contain valid file data.',
              {
                fileName:
                  request.fileName || '',
                fileStorageKey:
                  request.fileStorageKey || '',
              }
            );
          }
        }

        if (
          request.editorMode ===
            'create-new-file' &&
          !editorHtml.trim()
        ) {
          editorHtml = '<p></p>';
        }

        const looksLikeHtml =
          /<\/?[a-z][\s\S]*>/i.test(
            editorHtml
          );

        const normalizedHtml =
          looksLikeHtml
            ? editorHtml
            : editorHtml
                .split(/\r?\n/)
                .map((line) =>
                  line.trim()
                    ? `<p>${escapeHtml(line)}</p>`
                    : '<p></p>'
                )
                .join('');

        if (isCancelled) return;

        activeEditor.commands.setContent(
          normalizedHtml || '<p></p>',
          { emitUpdate: false }
        );

        const nextValue: AppTextEditorValue = {
          html: activeEditor.getHTML(),
          plain_text:
            getEditorPlainText(activeEditor),
          json_content: activeEditor.getJSON(),
        };

        setCurrentValue(nextValue);

        if (hasValidOnChange) {
          onChange?.(nextValue);
        }

        setSaveStatus('saved');
      } catch (error) {
        syllabusBuilderRequestLoadedRef.current =
          false;

        console.error(
          'Unable to load the Syllabus Builder editor request:',
          error
        );
      }
    }

    void loadSyllabusBuilderRequest();

    return () => {
      isCancelled = true;
    };
  }, [
    editor,
    hasValidOnChange,
    onChange,
  ]);

  const hasTableInDocument = Boolean(editor && (editor.isActive('table') || editorHasTable(editor) || /<table[\s>]/i.test(currentValue.html)));

  const editorStats = useMemo(() => {
    return calculateEditorStats(currentValue.plain_text);
  }, [currentValue.plain_text]);


  const pagedPreviewHtml = useMemo(() => {
    return buildPagedDocumentHtml(currentValue.html, {
      mode: 'preview',
      emptyMessage: '<p style="color:#94a3b8; font-style:italic;">Document content empty</p>',
    });
  }, [currentValue.html]);

  const documentCanvasStyle = useMemo<CSSProperties>(() => {
    const pageWidthMap: Record<LayoutPageSizePreset, { portrait: string; landscape: string }> = {
      A4: { portrait: '794px', landscape: '1123px' },
      Letter: { portrait: '816px', landscape: '1056px' },
      Legal: { portrait: '816px', landscape: '1344px' },
    };

    const pageMinHeightMap: Record<LayoutPageSizePreset, { portrait: string; landscape: string }> = {
      A4: { portrait: '1123px', landscape: '794px' },
      Letter: { portrait: '1056px', landscape: '816px' },
      Legal: { portrait: '1344px', landscape: '816px' },
    };

    const padding =
      pageMargin === 'narrow'
        ? '24px'
        : pageMargin === 'wide'
          ? '72px'
          : pageMargin === 'mirrored'
            ? '56px 72px 56px 48px'
            : pageMargin === 'custom'
              ? '48px 64px'
              : '40px';

    const effectiveColumnCount = columnPreset === '1' ? 1 : columnPreset === '2' ? 2 : columnPreset === '3' ? 3 : 2;
    const effectiveColumnGap = effectiveColumnCount > 1 ? '34px' : 'normal';
    const effectiveColumnRule = effectiveColumnCount > 1 ? '1px solid rgba(148, 163, 184, 0.30)' : 'none';

    return {
      ['--layout-page-width' as string]: pageWidthMap[pageSize][pageOrientation],
      ['--layout-page-min-height' as string]: pageMinHeightMap[pageSize][pageOrientation],
      ['--layout-page-padding' as string]: padding,
      ['--layout-column-count' as string]: String(effectiveColumnCount),
      ['--layout-column-gap' as string]: effectiveColumnGap,
      ['--layout-column-rule' as string]: effectiveColumnRule,
      ['--layout-hyphenation' as string]: hyphenation ? 'auto' : 'manual',
      ['--layout-zoom' as string]: String(zoomPercent / 100),
      ['--layout-grid-background' as string]: showGridlines
        ? 'linear-gradient(rgba(148,163,184,.22) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.22) 1px, transparent 1px)'
        : 'none',
      ['--layout-grid-size' as string]: showGridlines ? '24px 24px' : 'auto',
      maxWidth: 'none',
      width: '100%',
      marginInline: '0',
      padding: 0,
      columnCount: 'auto' as any,
      columnGap: 'normal',
      hyphens: hyphenation ? 'auto' : 'manual',
      transform: 'none',
      transformOrigin: 'top left',
      backgroundImage: undefined,
      backgroundSize: undefined,
    };
  }, [
    columnPreset,
    hyphenation,
    pageMargin,
    pageOrientation,
    pageSize,
    showGridlines,
    zoomPercent,
  ]);

  const previewCanvasStyle = useMemo<CSSProperties>(() => {
    return {
      ...documentCanvasStyle,
      width: '100%',
      maxWidth: 'none',
      marginInline: 0,
      padding: 0,
      columnCount: undefined,
      columnGap: undefined,
      transform: 'none',
      transformOrigin: 'top left',
      backgroundImage: undefined,
      backgroundSize: undefined,
    };
  }, [documentCanvasStyle]);

  const isProductionPreviewMode = showPreview && editorMode === 'preview';

  const showWritePanel =
    editorMode === 'write' || editorMode === 'split' || !showPreview || isProductionPreviewMode;

  const showPreviewPanel =
    showPreview && (editorMode === 'preview' || editorMode === 'split');


  const onlineVideoPreviewInfo = useMemo(() => {
    return getOnlineVideoEmbedInfo(onlineVideoUrl);
  }, [onlineVideoUrl]);

  const equationPreviewLatex = useMemo(() => {
    return equationLatex.trim();
  }, [equationLatex]);

  const equationPreviewDisplayText = useMemo(() => {
    return normalizeEquationDisplayText(equationPreviewLatex);
  }, [equationPreviewLatex]);

  const isSplitSideBarHidden = editorMode === 'split' && isSplitSidebarHidden;

  useEffect(() => {
    if (editorMode !== 'split' && isSplitSidebarHidden) {
      setIsSplitSidebarHidden(false);
    }
  }, [editorMode, isSplitSidebarHidden]);

  useEffect(() => {
    if (!editor || typeof window === 'undefined') return;

    function handleEquationEditEvent(event: Event) {
      const detail = (event as CustomEvent<EquationEditEventDetail>).detail;

      if (!detail || detail.editorId !== id) return;

      setEquationDialogMode('edit');
      setEditingEquationPos(detail.position);
      setEquationLatex(detail.latex || '');
      setEquationDisplayMode(detail.display === 'inline' ? 'inline' : 'block');
      setIsEquationDialogOpen(true);
    }

    window.addEventListener(
      'app-text-editor-equation-edit',
      handleEquationEditEvent as EventListener
    );

    return () => {
      window.removeEventListener(
        'app-text-editor-equation-edit',
        handleEquationEditEvent as EventListener
      );
    };
  }, [editor, id]);

  const editorShellRuntimeStyle = useMemo<CSSProperties | undefined>(() => {
    return undefined;
  }, []);

  const workspaceAreaRuntimeStyle = useMemo<CSSProperties | undefined>(() => {
    if (editorMode !== 'split') return undefined;

    return {
      width: '100%',
      maxWidth: 'none',
      minWidth: 0,
    };
  }, [editorMode]);

  const editorBodyRuntimeStyle = useMemo<CSSProperties | undefined>(() => {
    if (editorMode !== 'split') return undefined;

    const availableHeight = isSplitSideBarHidden
      ? 'calc(100vh - 178px)'
      : 'calc(100vh - 326px)';

    return {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
      gap: '16px',
      alignItems: 'stretch',
      height: availableHeight,
      maxHeight: availableHeight,
      minHeight: isSplitSideBarHidden ? '640px' : '520px',
      overflow: 'hidden',
    };
  }, [editorMode, isSplitSideBarHidden]);

  const splitScrollablePanelStyle = useMemo<CSSProperties | undefined>(() => {
    if (editorMode !== 'split') return undefined;

    return {
      height: '100%',
      minHeight: 0,
      minWidth: 0,
      overflowX: 'hidden',
      overflowY: 'auto',
      overscrollBehavior: 'contain',
      scrollbarGutter: 'stable',
    };
  }, [editorMode]);

  const openProductionFullscreen = useCallback(() => {
    setIsProductionFullscreen(true);

    if (typeof document === 'undefined') return;

    const fullscreenTarget = document.documentElement;

    if (!document.fullscreenElement && fullscreenTarget.requestFullscreen) {
      fullscreenTarget.requestFullscreen().catch(() => {
        // Browser fullscreen can fail if permissions are blocked.
        // The fixed production overlay still opens as a fallback.
      });
    }
  }, []);

  const closeProductionFullscreen = useCallback(() => {
    setIsProductionFullscreen(false);

    if (typeof document === 'undefined') return;

    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {
        // Ignore fullscreen exit errors and keep the UI state correct.
      });
    }
  }, []);

  useEffect(() => {
    if (!isProductionFullscreen || typeof document === 'undefined') return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProductionFullscreen(false);
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsProductionFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isProductionFullscreen]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor || !value) return;

    const nextHtml = getInitialHtml(value);

    if (nextHtml !== editor.getHTML()) {
      (editor.commands as any).setContent(nextHtml, { emitUpdate: false });

      setCurrentValue({
        html: editor.getHTML(),
        plain_text: getEditorPlainText(editor),
        json_content: editor.getJSON(),
      });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor || !storageKey || value) return;

    const savedValue = window.localStorage.getItem(storageKey);

    if (savedValue) {
      try {
        const parsedValue = JSON.parse(savedValue) as AppTextEditorValue;
        const nextHtml = getInitialHtml(parsedValue);

        (editor.commands as any).setContent(nextHtml, { emitUpdate: false });

        setCurrentValue({
          html: editor.getHTML(),
          plain_text: getEditorPlainText(editor),
          json_content: editor.getJSON(),
        });

        setSaveStatus('saved');
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }

    const savedComments = window.localStorage.getItem(`${storageKey}_comments`);

    if (savedComments) {
      try {
        setComments(JSON.parse(savedComments));
      } catch {
        window.localStorage.removeItem(`${storageKey}_comments`);
      }
    }

    const savedVersions = window.localStorage.getItem(`${storageKey}_versions`);

    if (savedVersions) {
      try {
        setVersions(JSON.parse(savedVersions));
      } catch {
        window.localStorage.removeItem(`${storageKey}_versions`);
      }
    }

    const savedCitations = window.localStorage.getItem(`${storageKey}_citations`);

    if (savedCitations) {
      try {
        setCitationSources(JSON.parse(savedCitations));
      } catch {
        window.localStorage.removeItem(`${storageKey}_citations`);
      }
    }
  }, [editor, storageKey, value]);

  useEffect(() => {
    if (!enableAutosave || !storageKey) return;

    if (autosaveFirstRenderRef.current) {
      autosaveFirstRenderRef.current = false;
      return;
    }

    setSaveStatus('typing');

    const timeoutId = window.setTimeout(() => {
      window.localStorage.setItem(storageKey, JSON.stringify(currentValue));
      window.localStorage.setItem(`${storageKey}_comments`, JSON.stringify(comments));
      window.localStorage.setItem(`${storageKey}_versions`, JSON.stringify(versions));
      window.localStorage.setItem(`${storageKey}_citations`, JSON.stringify(citationSources));
      setSaveStatus('saved');

      if (typeof onAutosave === 'function') {
        onAutosave(currentValue);
      }
    }, autosaveDelayMs);

    return () => window.clearTimeout(timeoutId);
  }, [
    autosaveDelayMs,
    citationSources,
    comments,
    currentValue,
    enableAutosave,
    onAutosave,
    storageKey,
    versions,
  ]);

  useEffect(() => {
    const currentTabIsHidden =
      (activeRibbonTab === 'academic' && !enableUniversityTools) ||
      (activeRibbonTab === 'ai' && !enableAiTools);

    if (currentTabIsHidden) {
      setActiveRibbonTab('home');
    }
  }, [activeRibbonTab, enableUniversityTools, enableAiTools]);


  useEffect(() => {
    if (!editor) return;

    const rootElement = editor.view.dom as HTMLElement;

    const rememberFromEventTarget = (event: Event) => {
      rememberDomTableCell(event.target);
    };

    const rememberFromSelection = () => {
      rememberDomTableCell();
    };

    rootElement.addEventListener('mousedown', rememberFromEventTarget, true);
    rootElement.addEventListener('mouseup', rememberFromEventTarget, true);
    rootElement.addEventListener('click', rememberFromEventTarget, true);
    rootElement.addEventListener('keyup', rememberFromEventTarget, true);
    document.addEventListener('selectionchange', rememberFromSelection);

    return () => {
      rootElement.removeEventListener('mousedown', rememberFromEventTarget, true);
      rootElement.removeEventListener('mouseup', rememberFromEventTarget, true);
      rootElement.removeEventListener('click', rememberFromEventTarget, true);
      rootElement.removeEventListener('keyup', rememberFromEventTarget, true);
      document.removeEventListener('selectionchange', rememberFromSelection);
    };
  }, [editor]);

  useEffect(() => {
    return () => {
      if (toolbarScrollRestoreFrameRef.current !== null) {
        window.cancelAnimationFrame(toolbarScrollRestoreFrameRef.current);
      }

      if (toolbarScrollReleaseTimerRef.current !== null) {
        window.clearTimeout(toolbarScrollReleaseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const closeHomeDropdown = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof HTMLElement)) return;

      if (
        !target.closest('[data-home-dropdown-root="true"]') &&
        !target.closest('[data-home-dropdown-menu="true"]')
      ) {
        setOpenHomeDropdown(null);
        setHomeDropdownPosition(null);
      }
    };

    document.addEventListener('mousedown', closeHomeDropdown);

    return () => {
      document.removeEventListener('mousedown', closeHomeDropdown);
    };
  }, []);

  useEffect(() => {
    if (!openHomeDropdown || typeof window === 'undefined') return;

    const syncDropdownPosition = (event?: Event) => {
      const target = event?.target;

      if (target instanceof HTMLElement && target.closest('[data-home-dropdown-menu="true"]')) {
        return;
      }

      updateHomeDropdownPosition(openHomeDropdown);
    };

    syncDropdownPosition();

    window.addEventListener('resize', syncDropdownPosition);
    window.addEventListener('scroll', syncDropdownPosition, true);

    return () => {
      window.removeEventListener('resize', syncDropdownPosition);
      window.removeEventListener('scroll', syncDropdownPosition, true);
    };
  }, [openHomeDropdown]);


  function getHomeDropdownMetrics(dropdownType: HomeDropdownKey) {
    if (dropdownType === 'fontFamily') {
      return {
        width: 312,
        maxHeight: 304,
      };
    }

    if (dropdownType === 'fontSize') {
      return {
        width: 132,
        maxHeight: 268,
      };
    }

    if (dropdownType === 'textColor' || dropdownType === 'highlightColor') {
      return {
        width: 236,
        maxHeight: 304,
      };
    }

    if (dropdownType === 'paragraphPreset') {
      return {
        width: 188,
        maxHeight: 230,
      };
    }

    if (dropdownType === 'lineSpacing') {
      return {
        width: 166,
        maxHeight: 252,
      };
    }

    if (dropdownType === 'bulletStyle') {
      return {
        width: 286,
        maxHeight: 304,
      };
    }

    if (dropdownType === 'numberStyle') {
      return {
        width: 226,
        maxHeight: 268,
      };
    }

    if (dropdownType === 'chartTemplate') {
      return {
        width: 286,
        maxHeight: 336,
      };
    }

    if (dropdownType === 'smartArtTemplate') {
      return {
        width: 304,
        maxHeight: 336,
      };
    }

    return {
      width: 186,
      maxHeight: 230,
    };
  }

  function updateHomeDropdownPosition(dropdownType: HomeDropdownKey) {
    if (typeof window === 'undefined') return;

    const triggerElement = homeDropdownTriggerRefs.current[dropdownType];

    if (!triggerElement) return;

    const triggerRect = triggerElement.getBoundingClientRect();
    const metrics = getHomeDropdownMetrics(dropdownType);
    const viewportPadding = 10;
    const availableViewportWidth = window.innerWidth - viewportPadding * 2;
    const availableViewportHeight = window.innerHeight - viewportPadding * 2;
    const menuWidth = Math.min(metrics.width, availableViewportWidth);
    const menuHeight = Math.min(metrics.maxHeight, availableViewportHeight);

    let left = triggerRect.left;
    let top = triggerRect.bottom + 8;

    if (left + menuWidth > window.innerWidth - viewportPadding) {
      left = window.innerWidth - menuWidth - viewportPadding;
    }

    if (left < viewportPadding) {
      left = viewportPadding;
    }

    if (top + menuHeight > window.innerHeight - viewportPadding) {
      top = Math.max(viewportPadding, triggerRect.top - menuHeight - 8);
    }

    setHomeDropdownPosition({
      top,
      left,
      width: menuWidth,
      maxHeight: menuHeight,
    });
  }


  function normalizeInsertNumber(rawValue: string) {
    const cleanedValue = rawValue
      .replace(/,/g, '')
      .replace(/%/g, '')
      .replace(/[^0-9.+-]/g, '')
      .trim();

    const parsedValue = Number.parseFloat(cleanedValue);

    return Number.isNaN(parsedValue) ? 0 : parsedValue;
  }


  function svgToDataUri(svg: string) {
    if (typeof window !== 'undefined' && window.btoa) {
      return `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svg)))}`;
    }

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function svgText(value: string) {
    return escapeHtml(value).replace(/\n/g, ' ');
  }

  function buildPreviewImageHtml({
    kind,
    type,
    title,
    svg,
  }: {
    kind: 'chart' | 'smartart';
    type: string;
    title: string;
    svg: string;
  }) {
    const previewAttribute =
      kind === 'chart'
        ? 'data-chart-preview-table="true"'
        : 'data-smartart-preview-table="true"';
    const typeAttribute =
      kind === 'chart'
        ? `data-chart-type="${escapeHtml(type)}"`
        : `data-smartart-type="${escapeHtml(type)}"`;
    const altText = kind === 'chart' ? `Charts: ${title}` : `SmartArt: ${title}`;

    return `
      <p style="margin:0 0 14px;">
        <img
          src="${escapeHtml(svgToDataUri(svg))}"
          alt="${escapeHtml(altText)}"
          title="${escapeHtml(altText)}"
          ${previewAttribute}
          data-insert-object-preview-table="true"
          ${typeAttribute}
          data-image-width="100%"
          data-image-align="center"
        />
      </p>
    `;
  }

  function buildInsertChartSvg(type: string, rows: string[][]) {
    const headerRow = rows[0] || ['Category', 'Value'];
    const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell.trim()));
    const chartOption = editableChartOptions.find((chart) => chart.value === type);
    const title = chartOption?.label || 'Chart';
    const values = dataRows.map((row) => Math.max(0, normalizeInsertNumber(row[1] || row[2] || '0')));
    const maxValue = Math.max(1, ...values);
    const totalValue = values.reduce((sum, value) => sum + value, 0);
    const colors = ['#60a5fa', '#86efac', '#fdba74', '#c4b5fd', '#fda4af', '#67e8f9', '#fde68a', '#93c5fd'];
    const width = 900;
    const height = 420;
    const plotLeft = 72;
    const plotTop = 74;
    const plotWidth = 520;
    const plotHeight = 240;

    function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

      return {
        x: cx + radius * Math.cos(angleInRadians),
        y: cy + radius * Math.sin(angleInRadians),
      };
    }

    function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
      const start = polarToCartesian(cx, cy, radius, endAngle);
      const end = polarToCartesian(cx, cy, radius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

      return [
        `M ${cx} ${cy}`,
        `L ${start.x} ${start.y}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
        'Z',
      ].join(' ');
    }

    function legendHtml(startX = 620, startY = 112, valueColumnIndex = 1) {
      return dataRows.map((row, index) => {
        const y = startY + index * 32;
        const label = row[0] || `Item ${index + 1}`;
        const value = row[valueColumnIndex] || '0';

        return `
          <rect x="${startX}" y="${y - 13}" width="18" height="18" rx="5" fill="${colors[index % colors.length]}" />
          <text x="${startX + 28}" y="${y}" class="legend-label">${svgText(label)}</text>
          <text x="${width - 52}" y="${y}" class="legend-value" text-anchor="end">${svgText(value)}</text>
        `;
      }).join('');
    }

    let visual = '';

    if (type === 'pie' || type === 'doughnut' || type === 'sunburst') {
      const cx = 285;
      const cy = 220;
      const radius = type === 'sunburst' ? 118 : 126;
      const total = Math.max(1, totalValue);
      let startAngle = 0;
      const sliceHtml = dataRows.map((row, index) => {
        const value = Math.max(0, normalizeInsertNumber(row[1] || row[2] || '0'));
        const sweep = (value / total) * 360;
        const endAngle = startAngle + sweep;
        const path = describeArc(cx, cy, radius, startAngle, endAngle || startAngle + 0.01);
        const midAngle = startAngle + sweep / 2;
        const labelPoint = polarToCartesian(cx, cy, radius * 0.64, midAngle);
        const percent = Math.round((value / total) * 100);
        startAngle = endAngle;

        return `
          <path d="${path}" fill="${colors[index % colors.length]}" stroke="#ffffff" stroke-width="3" />
          ${percent > 4 ? `<text x="${labelPoint.x}" y="${labelPoint.y}" text-anchor="middle" dominant-baseline="middle" class="slice-label">${percent}%</text>` : ''}
        `;
      }).join('');
      const centerHole = type === 'doughnut' || type === 'sunburst'
        ? `<circle cx="${cx}" cy="${cy}" r="58" fill="#ffffff" stroke="#dbeafe" stroke-width="2" />
           <text x="${cx}" y="${cy - 4}" text-anchor="middle" class="center-total">${svgText(String(totalValue))}</text>
           <text x="${cx}" y="${cy + 18}" text-anchor="middle" class="center-caption">Total</text>`
        : '';

      visual = `
        <g>
          ${sliceHtml}
          ${centerHole}
        </g>
        <g>${legendHtml()}</g>
      `;
    } else if (type === 'line' || type === 'area' || type === 'combo' || type === 'stock') {
      const points = values.map((value, index) => {
        const x = plotLeft + (index * plotWidth) / Math.max(1, values.length - 1);
        const y = plotTop + plotHeight - (value / maxValue) * plotHeight;

        return { x, y, value };
      });
      const pointString = points.map((point) => `${point.x},${point.y}`).join(' ');
      const areaString = points.length
        ? `${plotLeft},${plotTop + plotHeight} ${pointString} ${plotLeft + plotWidth},${plotTop + plotHeight}`
        : '';
      const barWidth = Math.max(26, plotWidth / Math.max(1, dataRows.length) - 22);

      visual = `
        <line x1="${plotLeft}" y1="${plotTop}" x2="${plotLeft}" y2="${plotTop + plotHeight}" class="axis" />
        <line x1="${plotLeft}" y1="${plotTop + plotHeight}" x2="${plotLeft + plotWidth}" y2="${plotTop + plotHeight}" class="axis" />
        ${type === 'area' ? `<polygon points="${areaString}" class="area-fill" />` : ''}
        ${type === 'combo' ? points.map((point, index) => {
          const barHeight = plotTop + plotHeight - point.y;
          const x = plotLeft + index * (barWidth + 22) + 10;
          return `<rect x="${x}" y="${point.y}" width="${barWidth}" height="${barHeight}" rx="8" fill="${colors[index % colors.length]}" opacity="0.72" />`;
        }).join('') : ''}
        <polyline points="${pointString}" class="line-path" />
        ${points.map((point, index) => `<circle cx="${point.x}" cy="${point.y}" r="7" fill="${colors[index % colors.length]}" stroke="#ffffff" stroke-width="3" />`).join('')}
        ${dataRows.map((row, index) => {
          const x = plotLeft + (index * plotWidth) / Math.max(1, dataRows.length - 1);
          return `<text x="${x}" y="${plotTop + plotHeight + 28}" text-anchor="middle" class="axis-label">${svgText(row[0] || `P${index + 1}`)}</text>`;
        }).join('')}
      `;
    } else if (type === 'scatter') {
      const xValues = dataRows.map((row) => normalizeInsertNumber(row[1] || '0'));
      const yValues = dataRows.map((row) => normalizeInsertNumber(row[2] || '0'));
      const maxX = Math.max(1, ...xValues);
      const maxY = Math.max(1, ...yValues);

      visual = `
        <line x1="${plotLeft}" y1="${plotTop}" x2="${plotLeft}" y2="${plotTop + plotHeight}" class="axis" />
        <line x1="${plotLeft}" y1="${plotTop + plotHeight}" x2="${plotLeft + plotWidth}" y2="${plotTop + plotHeight}" class="axis" />
        ${dataRows.map((row, index) => {
          const x = plotLeft + (normalizeInsertNumber(row[1] || '0') / maxX) * plotWidth;
          const y = plotTop + plotHeight - (normalizeInsertNumber(row[2] || '0') / maxY) * plotHeight;
          return `<circle cx="${x}" cy="${y}" r="10" fill="${colors[index % colors.length]}" opacity="0.9" />
                  <text x="${x + 12}" y="${y - 8}" class="axis-label">${svgText(row[0] || `P${index + 1}`)}</text>`;
        }).join('')}
      `;
    } else if (type === 'radar') {
      const cx = 300;
      const cy = 212;
      const radius = 120;
      const points = values.map((value, index) => {
        const angle = (-Math.PI / 2) + (index * 2 * Math.PI) / Math.max(1, values.length);
        const r = (value / maxValue) * radius;

        return {
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          labelX: cx + Math.cos(angle) * (radius + 28),
          labelY: cy + Math.sin(angle) * (radius + 28),
        };
      });

      visual = `
        <circle cx="${cx}" cy="${cy}" r="${radius}" class="grid-circle" />
        <circle cx="${cx}" cy="${cy}" r="${radius / 2}" class="grid-circle" />
        <polygon points="${points.map((point) => `${point.x},${point.y}`).join(' ')}" class="radar-fill" />
        ${points.map((point, index) => `<circle cx="${point.x}" cy="${point.y}" r="6" fill="${colors[index % colors.length]}" />
          <text x="${point.labelX}" y="${point.labelY}" text-anchor="middle" class="axis-label">${svgText(dataRows[index]?.[0] || `Item ${index + 1}`)}</text>`).join('')}
      `;
    } else if (type === 'treemap' || type === 'surface' || type === 'map' || type === 'sunburst') {
      const total = Math.max(1, values.reduce((sum, value) => sum + value, 0));
      let x = 72;
      let y = 86;
      let rowHeight = 94;

      visual = dataRows.map((row, index) => {
        const value = Math.max(0, normalizeInsertNumber(row[2] || row[1] || '0'));
        const rectWidth = Math.max(92, Math.min(246, (value / total) * 540));
        if (x + rectWidth > 590) {
          x = 72;
          y += rowHeight + 12;
        }
        const currentX = x;
        const currentY = y;
        x += rectWidth + 12;

        return `<rect x="${currentX}" y="${currentY}" width="${rectWidth}" height="${rowHeight}" rx="16" fill="${colors[index % colors.length]}" opacity="0.88" />
                <text x="${currentX + 14}" y="${currentY + 34}" class="block-label">${svgText(row[1] || row[0] || `Item ${index + 1}`)}</text>
                <text x="${currentX + 14}" y="${currentY + 62}" class="block-value">${svgText(String(value))}</text>`;
      }).join('');
    } else if (['bar', 'funnel', 'waterfall', 'histogram', 'boxWhisker'].includes(type)) {
      visual = `
        ${dataRows.map((row, index) => {
          const value = Math.max(0, normalizeInsertNumber(row[1] || row[2] || '0'));
          const barWidth = Math.max(22, (value / maxValue) * 470);
          const y = 84 + index * 42;

          return `<text x="72" y="${y + 18}" class="axis-label">${svgText(row[0] || `Item ${index + 1}`)}</text>
                  <rect x="230" y="${y}" width="${barWidth}" height="26" rx="10" fill="${colors[index % colors.length]}" />
                  <text x="${242 + barWidth}" y="${y + 18}" class="axis-value">${svgText(String(value))}</text>`;
        }).join('')}
      `;
    } else {
      const barWidth = Math.max(34, plotWidth / Math.max(1, dataRows.length) - 20);

      visual = `
        <line x1="${plotLeft}" y1="${plotTop}" x2="${plotLeft}" y2="${plotTop + plotHeight}" class="axis" />
        <line x1="${plotLeft}" y1="${plotTop + plotHeight}" x2="${plotLeft + plotWidth}" y2="${plotTop + plotHeight}" class="axis" />
        ${dataRows.map((row, index) => {
          const value = Math.max(0, normalizeInsertNumber(row[1] || '0'));
          const barHeight = Math.max(10, (value / maxValue) * plotHeight);
          const x = plotLeft + 26 + index * (barWidth + 24);
          const y = plotTop + plotHeight - barHeight;

          return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="10" fill="${colors[index % colors.length]}" />
                  <text x="${x + barWidth / 2}" y="${plotTop + plotHeight + 28}" text-anchor="middle" class="axis-label">${svgText(row[0] || `Item ${index + 1}`)}</text>`;
        }).join('')}
      `;
    }

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <style>
          .title{font:800 26px Segoe UI,Arial,sans-serif;fill:#0f172a;}
          .subtitle{font:700 13px Segoe UI,Arial,sans-serif;fill:#64748b;}
          .axis{stroke:#94a3b8;stroke-width:2;}
          .axis-label{font:700 12px Segoe UI,Arial,sans-serif;fill:#334155;}
          .axis-value{font:800 12px Segoe UI,Arial,sans-serif;fill:#0f172a;}
          .legend-label{font:800 14px Segoe UI,Arial,sans-serif;fill:#0f172a;}
          .legend-value{font:700 13px Segoe UI,Arial,sans-serif;fill:#334155;}
          .slice-label{font:900 16px Segoe UI,Arial,sans-serif;fill:#0f172a;}
          .center-total{font:900 24px Segoe UI,Arial,sans-serif;fill:#0f172a;}
          .center-caption{font:800 11px Segoe UI,Arial,sans-serif;fill:#64748b;text-transform:uppercase;}
          .line-path{fill:none;stroke:#2563eb;stroke-width:5;stroke-linecap:round;stroke-linejoin:round;}
          .area-fill{fill:#93c5fd;opacity:.36;}
          .grid-circle{fill:none;stroke:#cbd5e1;stroke-width:2;}
          .radar-fill{fill:#60a5fa;opacity:.38;stroke:#2563eb;stroke-width:4;}
          .block-label{font:800 13px Segoe UI,Arial,sans-serif;fill:#0f172a;}
          .block-value{font:900 24px Segoe UI,Arial,sans-serif;fill:#0f172a;}
        </style>
        <rect x="10" y="10" width="880" height="400" rx="28" fill="#f8fafc" stroke="#cbd5e1" />
        <text x="36" y="48" class="title">${svgText(title)}</text>
        <text x="36" y="70" class="subtitle">Editable chart preview. Change the table values to refresh this visual.</text>
        ${visual}
        <text x="36" y="386" class="subtitle">Total: ${svgText(String(totalValue))} • Series: ${svgText(headerRow.slice(1).filter(Boolean).join(', ') || 'Value')}</text>
      </svg>
    `;
  }

  function buildInsertSmartArtSvg(type: string, rows: string[][]) {
    const bodyRows = rows.length > 1 ? rows.slice(1) : rows;
    const safeRows = bodyRows.length > 0 ? bodyRows : [['Topic', 'Description']];
    const flatItems = safeRows.flat().filter((item) => item.trim());
    const smartArtOption = smartArtTemplateOptions.find((template) => template.value === type);
    const title = smartArtOption?.label || 'SmartArt';
    const colors = ['#60a5fa', '#86efac', '#fdba74', '#c4b5fd', '#fda4af', '#67e8f9'];
    const width = 900;
    const height = 420;

    function pill(x: number, y: number, w: number, h: number, label: string, index: number) {
      return `
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="${colors[index % colors.length]}" stroke="#ffffff" stroke-width="3" />
        <text x="${x + w / 2}" y="${y + h / 2 + 5}" text-anchor="middle" class="node-text">${svgText(label)}</text>
      `;
    }

    let visual = '';

    if (type === 'process' || type === 'chevronProcess') {
      const items = (rows[1] || rows[0] || ['Plan', 'Create', 'Review']).filter(Boolean).slice(0, 5);
      const startX = 58;
      const y = 176;
      const w = 134;
      const gap = 34;

      visual = items.map((item, index) => {
        const x = startX + index * (w + gap);
        return `${pill(x, y, w, 64, item, index)}${index < items.length - 1 ? `<text x="${x + w + 16}" y="${y + 40}" class="arrow">→</text>` : ''}`;
      }).join('');
    } else if (type === 'cycle') {
      const items = flatItems.slice(0, 6);
      const cx = 450;
      const cy = 222;
      const radius = 124;

      visual = `
        <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#cbd5e1" stroke-width="12" stroke-dasharray="28 18" />
        ${items.map((item, index) => {
          const angle = (-Math.PI / 2) + (index * 2 * Math.PI) / Math.max(1, items.length);
          const x = cx + Math.cos(angle) * radius - 58;
          const y = cy + Math.sin(angle) * radius - 28;
          return pill(x, y, 116, 56, item, index);
        }).join('')}
        <text x="${cx}" y="${cy + 6}" text-anchor="middle" class="center-text">Continuous cycle</text>
      `;
    } else if (type === 'hierarchy') {
      const topLabel = rows[0]?.[0] || 'Main topic';
      const children = (rows[1] || ['Subtopic A', 'Subtopic B', 'Subtopic C']).filter(Boolean).slice(0, 4);

      visual = `
        ${pill(352, 104, 196, 62, topLabel, 0)}
        <line x1="450" y1="166" x2="450" y2="222" class="connector" />
        <line x1="170" y1="222" x2="730" y2="222" class="connector" />
        ${children.map((child, index) => {
          const x = 92 + index * 178;
          return `<line x1="${x + 72}" y1="222" x2="${x + 72}" y2="250" class="connector" />${pill(x, 250, 144, 58, child, index + 1)}`;
        }).join('')}
      `;
    } else if (type === 'relationship') {
      const left = rows[1]?.[0] || rows[0]?.[0] || 'Concept A';
      const center = rows[1]?.[1] || rows[0]?.[1] || 'Connection';
      const right = rows[1]?.[2] || rows[0]?.[2] || 'Concept B';

      visual = `
        ${pill(92, 178, 190, 72, left, 0)}
        <text x="450" y="220" text-anchor="middle" class="relation-text">${svgText(center)}</text>
        <line x1="292" y1="214" x2="382" y2="214" class="connector" />
        <line x1="518" y1="214" x2="608" y2="214" class="connector" />
        ${pill(618, 178, 190, 72, right, 2)}
      `;
    } else if (type === 'matrix') {
      const cells = safeRows.flat().filter(Boolean).slice(0, 4);
      visual = cells.map((cell, index) => {
        const x = 200 + (index % 2) * 260;
        const y = 132 + Math.floor(index / 2) * 108;
        return pill(x, y, 220, 78, cell, index);
      }).join('');
    } else if (type === 'pyramid') {
      const items = safeRows.map((row) => row.join(' - ')).filter(Boolean).slice(0, 5).reverse();
      visual = items.map((item, index) => {
        const w = 500 - index * 64;
        const x = 450 - w / 2;
        const y = 286 - index * 50;
        return `<polygon points="${x},${y + 42} ${x + w},${y + 42} ${x + w - 30},${y} ${x + 30},${y}" fill="${colors[index % colors.length]}" stroke="#ffffff" stroke-width="3" />
                <text x="450" y="${y + 28}" text-anchor="middle" class="node-text">${svgText(item)}</text>`;
      }).join('');
    } else if (type === 'pictureList' || type === 'pictureCaptionList') {
      visual = safeRows.slice(0, 4).map((row, index) => {
        const x = 86 + index * 198;
        const label = row[1] || row[0] || `Visual ${index + 1}`;
        const desc = row[2] || row[1] || 'Description';
        return `
          <rect x="${x}" y="126" width="158" height="164" rx="22" fill="#ffffff" stroke="#cbd5e1" />
          <rect x="${x + 26}" y="148" width="106" height="70" rx="16" fill="${colors[index % colors.length]}" opacity="0.84" />
          <text x="${x + 79}" y="241" text-anchor="middle" class="card-title">${svgText(label)}</text>
          <text x="${x + 79}" y="265" text-anchor="middle" class="card-desc">${svgText(desc)}</text>
        `;
      }).join('');
    } else {
      const items = flatItems.slice(0, 6);
      visual = items.map((item, index) => {
        const x = 96 + (index % 3) * 236;
        const y = 120 + Math.floor(index / 3) * 112;
        return pill(x, y, 188, 72, item, index);
      }).join('');
    }

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <style>
          .title{font:800 26px Segoe UI,Arial,sans-serif;fill:#0f172a;}
          .subtitle{font:700 13px Segoe UI,Arial,sans-serif;fill:#64748b;}
          .node-text{font:900 13px Segoe UI,Arial,sans-serif;fill:#0f172a;}
          .arrow{font:900 30px Segoe UI,Arial,sans-serif;fill:#2563eb;}
          .connector{stroke:#94a3b8;stroke-width:4;stroke-linecap:round;}
          .center-text{font:900 15px Segoe UI,Arial,sans-serif;fill:#0f172a;}
          .relation-text{font:900 18px Segoe UI,Arial,sans-serif;fill:#0f172a;}
          .card-title{font:900 13px Segoe UI,Arial,sans-serif;fill:#0f172a;}
          .card-desc{font:700 11px Segoe UI,Arial,sans-serif;fill:#64748b;}
        </style>
        <rect x="10" y="10" width="880" height="400" rx="28" fill="#f8fafc" stroke="#cbd5e1" />
        <text x="36" y="48" class="title">${svgText(title)}</text>
        <text x="36" y="70" class="subtitle">Editable SmartArt preview. Change the table text to refresh this visual.</text>
        ${visual}
      </svg>
    `;
  }

  function readInsertTableRows(tableElement: HTMLTableElement) {
    return Array.from(tableElement.rows).map((row) => {
      return Array.from(row.cells).map((cell) => cell.textContent?.trim() || '');
    });
  }

  function buildEditableDataTableHtml(
    rows: string[][],
    tableAttributes: string,
    captionText: string
  ) {
    const isChartDataTable = tableAttributes.includes('data-chart-data-table');
    const isSmartArtDataTable = tableAttributes.includes('data-smartart-data-table');
    const isDynamicInsertDataTable = isChartDataTable || isSmartArtDataTable;
    const dynamicTableAttribute = isDynamicInsertDataTable
      ? ' data-insert-object-data-table="true"'
      : '';
    const tableClass = isDynamicInsertDataTable
      ? ` class="${styles.insertObjectDataTable}"`
      : '';
    const captionHtml = isDynamicInsertDataTable
      ? `<caption><span>${escapeHtml(captionText)}</span></caption>`
      : '';
    const tableRows = rows
      .map((row, rowIndex) => {
        const cellTag = rowIndex === 0 ? 'th' : 'td';
        const cellHtml = row
          .map((cell) => `<${cellTag}>${escapeHtml(cell)}</${cellTag}>`)
          .join('');

        return `<tr>${cellHtml}</tr>`;
      })
      .join('');

    if (isDynamicInsertDataTable) {
      return `
        <table${tableClass} ${tableAttributes}${dynamicTableAttribute}>
          ${captionHtml}
          <tbody>${tableRows}</tbody>
        </table>
      `;
    }

    return `
      <p><strong>${escapeHtml(captionText)}</strong></p>
      <table ${tableAttributes}>
        <tbody>${tableRows}</tbody>
      </table>
    `;
  }

  function buildSmartArtPreviewHtml(type: string, rows: string[][]) {
    const bodyRows = rows.length > 1 ? rows.slice(1) : rows;
    const safeRows = bodyRows.length > 0 ? bodyRows : [['Topic', 'Description']];
    const flatItems = safeRows.flat().filter((item) => item.trim());
    const smartArtOption = smartArtTemplateOptions.find((template) => template.value === type);
    const title = smartArtOption?.label || 'SmartArt';
    const colors = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2'];

    function smartArtNode(label: string, index: number, extraClass = '') {
      return `
        <div class="${styles.insertSmartArtNode} ${extraClass}" style="--smartart-node-color:${colors[index % colors.length]};">
          ${escapeHtml(label || `Item ${index + 1}`)}
        </div>
      `;
    }

    let visualHtml = '';

    if (type === 'process' || type === 'chevronProcess') {
      const items = (rows[1] || rows[0] || ['Plan', 'Create', 'Review']).filter(Boolean);

      visualHtml = `
        <div class="${styles.insertSmartArtProcess}">
          ${items.map((item, index) => `
            ${smartArtNode(item, index, type === 'chevronProcess' ? styles.insertSmartArtChevron : '')}
            ${index < items.length - 1 ? `<span class="${styles.insertSmartArtArrow}">→</span>` : ''}
          `).join('')}
        </div>
      `;
    } else if (type === 'cycle') {
      const items = flatItems.slice(0, 6);

      visualHtml = `
        <div class="${styles.insertSmartArtCycle}">
          ${items.map((item, index) => smartArtNode(`${index + 1}. ${item}`, index, styles.insertSmartArtRound)).join('')}
          <div class="${styles.insertSmartArtCycleLabel}">↻ Continuous cycle</div>
        </div>
      `;
    } else if (type === 'hierarchy') {
      const topLabel = rows[0]?.[0] || 'Main topic';
      const children = (rows[1] || ['Subtopic A', 'Subtopic B', 'Subtopic C']).filter(Boolean);
      const details = (rows[2] || []).filter(Boolean);

      visualHtml = `
        <div class="${styles.insertSmartArtHierarchy}">
          <div class="${styles.insertSmartArtHierarchyTop}">${smartArtNode(topLabel, 0)}</div>
          <div class="${styles.insertSmartArtConnector}">↓</div>
          <div class="${styles.insertSmartArtHierarchyChildren}">
            ${children.map((item, index) => smartArtNode(item, index + 1)).join('')}
          </div>
          ${details.length ? `<div class="${styles.insertSmartArtDetails}">${details.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div>` : ''}
        </div>
      `;
    } else if (type === 'relationship') {
      const left = rows[1]?.[0] || rows[0]?.[0] || 'Concept A';
      const center = rows[1]?.[1] || rows[0]?.[1] || 'Connection';
      const right = rows[1]?.[2] || rows[0]?.[2] || 'Concept B';

      visualHtml = `
        <div class="${styles.insertSmartArtRelationship}">
          ${smartArtNode(left, 0)}
          <div class="${styles.insertSmartArtRelationText}">${escapeHtml(center)}</div>
          ${smartArtNode(right, 2)}
        </div>
      `;
    } else if (type === 'matrix') {
      visualHtml = `
        <div class="${styles.insertSmartArtMatrix}">
          ${safeRows.slice(0, 4).map((row, rowIndex) => row.slice(0, 4).map((cell, cellIndex) => smartArtNode(cell, rowIndex + cellIndex)).join('')).join('')}
        </div>
      `;
    } else if (type === 'pyramid') {
      const items = safeRows.map((row) => row.join(' - ')).filter(Boolean).slice(0, 5).reverse();

      visualHtml = `
        <div class="${styles.insertSmartArtPyramid}">
          ${items.map((item, index) => `
            <div class="${styles.insertSmartArtPyramidLevel}" style="--smartart-node-color:${colors[index % colors.length]};width:${88 - index * 10}%;">
              ${escapeHtml(item)}
            </div>
          `).join('')}
        </div>
      `;
    } else if (type === 'pictureList' || type === 'pictureCaptionList') {
      visualHtml = `
        <div class="${styles.insertSmartArtPictureList}">
          ${safeRows.slice(0, 4).map((row, index) => `
            <div class="${styles.insertSmartArtPictureCard}">
              <div class="${styles.insertSmartArtPictureBox}">Picture</div>
              <strong>${escapeHtml(row[1] || row[0] || `Visual ${index + 1}`)}</strong>
              <span>${escapeHtml(row[2] || row[1] || 'Editable description')}</span>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      visualHtml = `
        <div class="${styles.insertSmartArtBlockList}">
          ${flatItems.slice(0, 6).map((item, index) => smartArtNode(item, index)).join('')}
        </div>
      `;
    }

    const smartArtSvg = buildInsertSmartArtSvg(type, rows);

    return buildPreviewImageHtml({
      kind: 'smartart',
      type,
      title,
      svg: smartArtSvg,
    });
  }

  function buildChartPreviewHtml(type: string, rows: string[][]) {
    const headerRow = rows[0] || ['Category', 'Value'];
    const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell.trim()));
    const categoryLabel = headerRow[0] || 'Category';
    const seriesHeaders = headerRow.slice(1).filter(Boolean);
    const chartOption = editableChartOptions.find((chart) => chart.value === type);
    const title = chartOption?.label || 'Chart';
    const values = dataRows.map((row) => Math.max(0, normalizeInsertNumber(row[1] || row[2] || '0')));
    const maxValue = Math.max(1, ...values);
    const totalValue = values.reduce((sum, value) => sum + value, 0);
    const largestRowIndex = values.indexOf(Math.max(0, ...values));
    const largestLabel = largestRowIndex >= 0 ? dataRows[largestRowIndex]?.[0] || 'Largest' : 'Largest';
    const chartHeight = 230;
    const chartWidth = 640;
    const colors = ['#60a5fa', '#86efac', '#fdba74', '#c4b5fd', '#fda4af', '#67e8f9', '#fde68a'];

    function legendHtml(valueColumnIndex = 1) {
      return `
        <div class="${styles.insertChartLegend}">
          ${dataRows.map((row, index) => `
            <div class="${styles.insertChartLegendItem}">
              <span style="background:${colors[index % colors.length]};"></span>
              <strong>${escapeHtml(row[0] || `Item ${index + 1}`)}</strong>
              <em>${escapeHtml(row[valueColumnIndex] || '0')}</em>
            </div>
          `).join('')}
        </div>
      `;
    }

    let chartVisualHtml = '';

    if (type === 'pie' || type === 'doughnut' || type === 'sunburst') {
      const total = Math.max(1, values.reduce((sum, value) => sum + value, 0));
      let currentOffset = 0;
      const slices = dataRows.map((row, index) => {
        const value = Math.max(0, normalizeInsertNumber(row[1] || '0'));
        const percent = (value / total) * 100;
        const start = currentOffset;
        currentOffset += percent;

        return `${colors[index % colors.length]} ${start}% ${currentOffset}%`;
      });

      chartVisualHtml = `
        <div class="${styles.insertPieChartLayout}">
          <div class="${styles.insertPieChart} ${type === 'doughnut' ? styles.insertDoughnutChart : ''}" style="background:conic-gradient(${slices.join(', ')});"></div>
          ${legendHtml(1)}
        </div>
      `;
    } else if (type === 'line' || type === 'area' || type === 'combo' || type === 'stock') {
      const points = values.map((value, index) => {
        const x = 52 + (index * (chartWidth - 104)) / Math.max(1, values.length - 1);
        const y = chartHeight - 42 - (value / maxValue) * (chartHeight - 76);

        return `${x},${y}`;
      });
      const areaPoints = points.length
        ? `52,${chartHeight - 42} ${points.join(' ')} ${chartWidth - 52},${chartHeight - 42}`
        : '';
      const barWidth = Math.max(18, Math.floor((chartWidth - 120) / Math.max(1, dataRows.length)) - 12);

      chartVisualHtml = `
        <svg class="${styles.insertChartSvg}" viewBox="0 0 ${chartWidth} ${chartHeight}" role="img" aria-label="${escapeHtml(title)} chart">
          <line x1="52" y1="24" x2="52" y2="${chartHeight - 42}" class="${styles.insertChartAxis}" />
          <line x1="52" y1="${chartHeight - 42}" x2="${chartWidth - 42}" y2="${chartHeight - 42}" class="${styles.insertChartAxis}" />
          ${type === 'area' ? `<polygon points="${areaPoints}" class="${styles.insertChartArea}" />` : ''}
          ${type === 'combo' ? dataRows.map((row, index) => {
            const value = Math.max(0, normalizeInsertNumber(row[1] || '0'));
            const height = (value / maxValue) * (chartHeight - 76);
            const x = 64 + index * (barWidth + 18);
            const y = chartHeight - 42 - height;
            return `<rect x="${x}" y="${y}" width="${barWidth}" height="${height}" rx="6" fill="${colors[index % colors.length]}" opacity=".72" />`;
          }).join('') : ''}
          <polyline points="${points.join(' ')}" class="${styles.insertChartLine}" />
          ${points.map((point) => {
            const [x, y] = point.split(',');
            return `<circle cx="${x}" cy="${y}" r="6" class="${styles.insertChartPoint}" />`;
          }).join('')}
        </svg>
      `;
    } else if (type === 'scatter') {
      const xValues = dataRows.map((row) => normalizeInsertNumber(row[1] || '0'));
      const yValues = dataRows.map((row) => normalizeInsertNumber(row[2] || '0'));
      const maxX = Math.max(1, ...xValues);
      const maxY = Math.max(1, ...yValues);

      chartVisualHtml = `
        <svg class="${styles.insertChartSvg}" viewBox="0 0 ${chartWidth} ${chartHeight}" role="img" aria-label="${escapeHtml(title)} chart">
          <line x1="52" y1="24" x2="52" y2="${chartHeight - 42}" class="${styles.insertChartAxis}" />
          <line x1="52" y1="${chartHeight - 42}" x2="${chartWidth - 42}" y2="${chartHeight - 42}" class="${styles.insertChartAxis}" />
          ${dataRows.map((row, index) => {
            const x = 52 + (normalizeInsertNumber(row[1] || '0') / maxX) * (chartWidth - 104);
            const y = chartHeight - 42 - (normalizeInsertNumber(row[2] || '0') / maxY) * (chartHeight - 76);
            return `<circle cx="${x}" cy="${y}" r="8" fill="${colors[index % colors.length]}"><title>${escapeHtml(row[0] || `Point ${index + 1}`)}</title></circle>`;
          }).join('')}
        </svg>
      `;
    } else if (type === 'radar') {
      const centerX = chartWidth / 2;
      const centerY = chartHeight / 2;
      const radius = 78;
      const points = values.map((value, index) => {
        const angle = (-Math.PI / 2) + (index * 2 * Math.PI) / Math.max(1, values.length);
        const r = (value / maxValue) * radius;
        return `${centerX + Math.cos(angle) * r},${centerY + Math.sin(angle) * r}`;
      });

      chartVisualHtml = `
        <svg class="${styles.insertChartSvg}" viewBox="0 0 ${chartWidth} ${chartHeight}" role="img" aria-label="${escapeHtml(title)} chart">
          <circle cx="${centerX}" cy="${centerY}" r="${radius}" class="${styles.insertChartAxis}" fill="none" />
          <circle cx="${centerX}" cy="${centerY}" r="${radius / 2}" class="${styles.insertChartGridCircle}" fill="none" />
          <polygon points="${points.join(' ')}" class="${styles.insertRadarShape}" />
        </svg>
      `;
    } else if (type === 'treemap') {
      const total = Math.max(1, values.reduce((sum, value) => sum + value, 0));

      chartVisualHtml = `
        <div class="${styles.insertTreeMapChart}">
          ${dataRows.map((row, index) => {
            const value = Math.max(0, normalizeInsertNumber(row[2] || row[1] || '0'));
            const widthPercent = Math.max(18, (value / total) * 100);
            return `<div style="flex-basis:${widthPercent}%;background:${colors[index % colors.length]};">${escapeHtml(row[1] || row[0] || `Item ${index + 1}`)}<strong>${value}</strong></div>`;
          }).join('')}
        </div>
      `;
    } else if (['bar', 'funnel', 'waterfall', 'histogram', 'boxWhisker', 'map', 'surface'].includes(type)) {
      chartVisualHtml = `
        <div class="${styles.insertHorizontalChart}">
          ${dataRows.map((row, index) => {
            const value = Math.max(0, normalizeInsertNumber(row[1] || row[2] || '0'));
            const percent = Math.max(4, Math.round((value / maxValue) * 100));
            return `
              <div class="${styles.insertHorizontalChartRow}">
                <span>${escapeHtml(row[0] || `Item ${index + 1}`)}</span>
                <div><i style="width:${percent}%;background:${colors[index % colors.length]};">${escapeHtml(String(value))}</i></div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else {
      const barWidth = Math.max(22, Math.floor((chartWidth - 110) / Math.max(1, dataRows.length)) - 14);

      chartVisualHtml = `
        <svg class="${styles.insertChartSvg}" viewBox="0 0 ${chartWidth} ${chartHeight}" role="img" aria-label="${escapeHtml(title)} chart">
          <line x1="52" y1="24" x2="52" y2="${chartHeight - 42}" class="${styles.insertChartAxis}" />
          <line x1="52" y1="${chartHeight - 42}" x2="${chartWidth - 42}" y2="${chartHeight - 42}" class="${styles.insertChartAxis}" />
          ${dataRows.map((row, index) => {
            const value = Math.max(0, normalizeInsertNumber(row[1] || '0'));
            const height = Math.max(8, (value / maxValue) * (chartHeight - 76));
            const x = 68 + index * (barWidth + 18);
            const y = chartHeight - 42 - height;
            return `
              <rect x="${x}" y="${y}" width="${barWidth}" height="${height}" rx="8" fill="${colors[index % colors.length]}" />
              <text x="${x + barWidth / 2}" y="${chartHeight - 22}" text-anchor="middle" class="${styles.insertChartText}">${escapeHtml(row[0] || `Item ${index + 1}`)}</text>
            `;
          }).join('')}
        </svg>
      `;
    }

    const chartSvg = buildInsertChartSvg(type, rows);

    return buildPreviewImageHtml({
      kind: 'chart',
      type,
      title,
      svg: chartSvg,
    });
  }

  function findInsertPreviewElement(
    tableElement: HTMLTableElement,
    previewAttributeName: string
  ) {
    const canvasElement = tableElement.closest('[data-insert-object-canvas="true"]') as HTMLElement | null;

    if (canvasElement) {
      const previewElement = canvasElement.querySelector<HTMLElement>(`[${previewAttributeName}]`);

      if (previewElement) {
        return (previewElement.closest('p') as HTMLElement | null) || previewElement;
      }
    }

    let previousElement = tableElement.previousElementSibling as HTMLElement | null;

    while (previousElement) {
      if (previousElement.hasAttribute(previewAttributeName)) {
        return previousElement;
      }

      const nestedPreviewElement = previousElement.querySelector<HTMLElement>(`[${previewAttributeName}]`);

      if (nestedPreviewElement) {
        return previousElement;
      }

      previousElement = previousElement.previousElementSibling as HTMLElement | null;
    }

    return null;
  }

  function refreshInsertObjectVisuals(shouldCommit = false) {
    if (!editor || insertVisualSyncRef.current) return;

    const rootElement = editor.view.dom as HTMLElement;
    let didUpdate = false;

    rootElement
      .querySelectorAll<HTMLTableElement>('table[data-smartart-data-table]')
      .forEach((tableElement) => {
        const type = tableElement.getAttribute('data-smartart-table-type') || 'basicBlockList';
        const previewElement = findInsertPreviewElement(
          tableElement,
          'data-smartart-preview-table'
        );
        const nextHtml = buildSmartArtPreviewHtml(
          type,
          readInsertTableRows(tableElement)
        );

        if (previewElement) {
          if (previewElement.outerHTML !== nextHtml) {
            previewElement.outerHTML = nextHtml;
            didUpdate = true;
          }
        } else {
          tableElement.insertAdjacentHTML('beforebegin', nextHtml);
          didUpdate = true;
        }
      });

    rootElement
      .querySelectorAll<HTMLTableElement>('table[data-chart-data-table]')
      .forEach((tableElement) => {
        const type = tableElement.getAttribute('data-chart-table-type') || 'column';
        const previewElement = findInsertPreviewElement(
          tableElement,
          'data-chart-preview-table'
        );
        const nextHtml = buildChartPreviewHtml(type, readInsertTableRows(tableElement));

        if (previewElement) {
          if (previewElement.outerHTML !== nextHtml) {
            previewElement.outerHTML = nextHtml;
            didUpdate = true;
          }
        } else {
          tableElement.insertAdjacentHTML('beforebegin', nextHtml);
          didUpdate = true;
        }
      });

    if (!didUpdate && !shouldCommit) return;
    if (!shouldCommit) return;

    const nextValue: AppTextEditorValue = {
      html: rootElement.innerHTML,
      plain_text: getEditorPlainText(editor),
      json_content: editor.getJSON(),
    };

    setCurrentValue(nextValue);

    if (hasValidOnChange) {
      onChange?.(nextValue);
    }
  }

  useEffect(() => {
    if (!editor) return;

    const rootElement = editor.view.dom as HTMLElement;

    const isInsideInsertDataTable = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;

      return Boolean(
        target.closest('table[data-chart-data-table]') ||
          target.closest('table[data-smartart-data-table]')
      );
    };

    const handleInput = (event: Event) => {
      if (!isInsideInsertDataTable(event.target)) return;

      window.setTimeout(() => refreshInsertObjectVisuals(true), 0);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter') return;
      if (!isInsideInsertDataTable(event.target)) return;

      event.preventDefault();
      event.stopPropagation();

      window.setTimeout(() => refreshInsertObjectVisuals(true), 0);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key !== 'Enter') return;
      if (!isInsideInsertDataTable(event.target)) return;

      window.setTimeout(() => refreshInsertObjectVisuals(true), 0);
    };

    const handlePaste = (event: ClipboardEvent) => {
      if (!isInsideInsertDataTable(event.target)) return;

      window.setTimeout(() => refreshInsertObjectVisuals(true), 0);
    };

    const handleBlur = (event: FocusEvent) => {
      if (!isInsideInsertDataTable(event.target)) return;

      window.setTimeout(() => refreshInsertObjectVisuals(true), 0);
    };

    window.setTimeout(() => refreshInsertObjectVisuals(false), 0);

    rootElement.addEventListener('input', handleInput);
    rootElement.addEventListener('keydown', handleKeyDown, true);
    rootElement.addEventListener('keyup', handleKeyUp);
    rootElement.addEventListener('paste', handlePaste);
    rootElement.addEventListener('blur', handleBlur, true);

    return () => {
      rootElement.removeEventListener('input', handleInput);
      rootElement.removeEventListener('keydown', handleKeyDown, true);
      rootElement.removeEventListener('keyup', handleKeyUp);
      rootElement.removeEventListener('paste', handlePaste);
      rootElement.removeEventListener('blur', handleBlur, true);
    };
  }, [editor]);

  function getLatestValue(): AppTextEditorValue {
    if (!editor) return currentValue;

    return {
      html: editor.getHTML(),
      plain_text: getEditorPlainText(editor),
      json_content: editor.getJSON(),
    };
  }


  function getSyllabusEditorContext() {
    if (typeof window === 'undefined') {
      return {
        isSyllabusMode: false,
        courseId: id,
        syllabusId: '',
        syllabusTitle: label || 'Syllabus',
        syllabusVersion: 'v1.0',
        sourceType: '' as SyllabusSourceType,
        structureType: '' as SyllabusStructureType,
        returnTo: '',
        fileName: '',
      };
    }

    const params = new URLSearchParams(window.location.search);

    const queryCourseId =
      params.get('courseId') ||
      params.get('course_id') ||
      '';

    const courseId = queryCourseId || id;

    let launchData: Record<string, unknown> = {};

    if (courseId) {
      try {
        const savedLaunchData = window.localStorage.getItem(
          `syllabus_editor_launch_${courseId}`
        );

        if (savedLaunchData) {
          launchData = JSON.parse(savedLaunchData) as Record<string, unknown>;
        }
      } catch {
        launchData = {};
      }
    }

    const mode =
      params.get('mode') ||
      getTextValue(launchData.mode);

    const rawSourceType =
      params.get('sourceType') ||
      getTextValue(launchData.syllabus_source_type);

    const rawStructureType =
      params.get('structureType') ||
      getTextValue(launchData.syllabus_structure_type);

    return {
      isSyllabusMode: mode === 'syllabus',
      courseId,
      syllabusId:
        params.get('syllabusId') ||
        getTextValue(launchData.syllabus_id),
      syllabusTitle:
        getTextValue(launchData.syllabus_title) ||
        label ||
        'Syllabus',
      syllabusVersion:
        getTextValue(launchData.syllabus_version) ||
        'v1.0',
      sourceType: normalizeSyllabusSourceType(rawSourceType),
      structureType: normalizeSyllabusStructureType(rawStructureType),
      returnTo:
        params.get('returnTo') ||
        getTextValue(launchData.return_to),
      fileName:
        getTextValue(launchData.file_name) ||
        getTextValue(launchData.original_file_name),
    };
  }

  function saveSyllabusEditorToStorage(saveMode: 'draft' | 'confirmed') {
    if (typeof window === 'undefined') {
      return;
    }

    const activeValue = getLatestValue();
    const context = getSyllabusEditorContext();
    const now = new Date().toISOString();
    const isConfirmed = saveMode === 'confirmed';
    const syllabusSections = extractSyllabusSectionsFromHtml(
      activeValue.html,
      context.structureType
    );

    const resultPayload = {
      source_type: context.sourceType,
      syllabus_source_type: context.sourceType,
      file_name: context.fileName,
      content_html: activeValue.html,
      content_text: activeValue.plain_text,
      content_json: activeValue.json_content || null,
      editor_content: activeValue,
      confirmed: isConfirmed,
      status: isConfirmed ? 'completed' : 'draft',
      syllabus_creation_status: isConfirmed ? 'completed' : 'draft',
      syllabus_creation_completed: isConfirmed,
      saved_at: now,
      updated_at: now,
      course_id: context.courseId,
      syllabus_id: context.syllabusId,
      syllabus_title: context.syllabusTitle,
      syllabus_version: context.syllabusVersion,
      syllabus_structure_type: context.structureType,
      syllabus_sections: syllabusSections,
      normalized_db_fields: [
        'course_id',
        'syllabus_id',
        'section_type',
        'section_number',
        'section_title',
        'content_text',
        'hours',
        'section_order',
        'parent_section_id',
        'custom_fields_json',
      ],
    };

    window.localStorage.setItem(
      `syllabus_editor_result_${context.courseId}`,
      JSON.stringify(resultPayload)
    );

    window.localStorage.setItem(
      `text_editor_content_${context.courseId}`,
      JSON.stringify(resultPayload)
    );

    const syllabusPageStorageKey = `course_syllabus_${context.courseId}`;

    try {
      const savedSyllabusPageData =
        window.localStorage.getItem(syllabusPageStorageKey);

      const parsedSyllabusPageData = savedSyllabusPageData
        ? JSON.parse(savedSyllabusPageData)
        : {};

      const nextSyllabusPageData = {
        ...parsedSyllabusPageData,
        syllabus: {
          ...(parsedSyllabusPageData.syllabus || {}),
          course_id: context.courseId,
          syllabus_id: context.syllabusId,
          syllabus_title: context.syllabusTitle,
          syllabus_version: context.syllabusVersion,
          syllabus_source_type: context.sourceType,
          syllabus_structure_type: context.structureType,
          status: isConfirmed ? 'review' : 'draft',
        },
        editor_preview: resultPayload,
        status: isConfirmed ? 'completed' : 'draft',
        syllabus_creation_completed: isConfirmed,
        updated_at: now,
      };

      window.localStorage.setItem(
        syllabusPageStorageKey,
        JSON.stringify(nextSyllabusPageData)
      );
    } catch {
      window.localStorage.setItem(
        syllabusPageStorageKey,
        JSON.stringify({
          syllabus: {
            course_id: context.courseId,
            syllabus_id: context.syllabusId,
            syllabus_title: context.syllabusTitle,
            syllabus_version: context.syllabusVersion,
            syllabus_source_type: context.sourceType,
            syllabus_structure_type: context.structureType,
            status: isConfirmed ? 'review' : 'draft',
          },
          editor_preview: resultPayload,
          status: isConfirmed ? 'completed' : 'draft',
          syllabus_creation_completed: isConfirmed,
          updated_at: now,
        })
      );
    }

    setCurrentValue(activeValue);

    if (hasValidOnChange) {
      onChange?.(activeValue);
    }

    setSaveStatus('saved');
  }

  function goBackToPreviousEditorScreen() {
    if (typeof window === 'undefined') {
      return;
    }

    const context = getSyllabusEditorContext();

    if (context.returnTo) {
      window.location.href = context.returnTo;
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = '/';
  }

  function returnToSyllabusBuilder(
    request: SyllabusBuilderEditorRequest
  ) {
    if (typeof window === 'undefined') {
      return;
    }

    window.location.href =
      request.returnUrl ||
      `/institute-admin/courses/syllabus-builder?courseId=${encodeURIComponent(
        request.courseId
      )}`;
  }

  function handleEditorClose() {
    if (syllabusBuilderRequest) {
      window.localStorage.removeItem(
        TEXT_EDITOR_REQUEST_STORAGE_KEY
      );

      returnToSyllabusBuilder(
        syllabusBuilderRequest
      );

      return;
    }

    goBackToPreviousEditorScreen();
  }

  function handleSyllabusDraftSave() {
    const activeValue = getLatestValue();

    if (syllabusBuilderRequest) {
      const updatedRequest:
        SyllabusBuilderEditorRequest = {
          ...syllabusBuilderRequest,
          content: activeValue.html,
        };

      window.localStorage.setItem(
        TEXT_EDITOR_REQUEST_STORAGE_KEY,
        JSON.stringify(updatedRequest)
      );

      setSyllabusBuilderRequest(
        updatedRequest
      );

      setCurrentValue(activeValue);

      if (hasValidOnChange) {
        onChange?.(activeValue);
      }

      setSaveStatus('saved');

      window.alert('Editor draft saved.');

      return;
    }

    saveSyllabusEditorToStorage('draft');

    window.alert('Syllabus draft saved.');
  }

  async function handleSyllabusSaveAndConfirm() {
    const activeValue = getLatestValue();

    if (syllabusBuilderRequest) {
      const isFileTarget =
        syllabusBuilderRequest.targetType ===
          'resource-file-content' ||
        syllabusBuilderRequest.targetType ===
          'resource-new-file' ||
        syllabusBuilderRequest.targetType ===
          'content-new-file' ||
        Boolean(
          syllabusBuilderRequest.fileStorageKey
        );

      let outputFormat:
        | 'docx'
        | 'txt'
        | 'pdf'
        | undefined;
      let fileName: string | undefined;
      let mimeType: string | undefined;
      let fileSize: string | undefined;
      let fileDataUrl: string | undefined;
      let fileStorageKey: string | undefined;

      try {
        if (isFileTarget) {
          outputFormat =
            getRequestedEditorOutputFormat(
              syllabusBuilderRequest
            );

          fileName = replaceFileExtension(
            syllabusBuilderRequest.fileName ||
              syllabusBuilderRequest.label ||
              'Edited Document',
            outputFormat
          );

          let outputBlob: Blob;

          if (outputFormat === 'txt') {
            outputBlob = new Blob(
              [activeValue.plain_text],
              {
                type: 'text/plain;charset=utf-8',
              }
            );
          } else if (
            outputFormat === 'pdf'
          ) {
            outputBlob = createSimplePdfBlob(
              activeValue.plain_text
            );
          } else {
            outputBlob =
              createWordCompatibleBlob(
                fileName,
                activeValue.html
              );
          }

          mimeType = outputBlob.type;
          fileSize =
            formatGeneratedFileSize(
              outputBlob.size
            );
          fileDataUrl =
            await blobToDataUrl(outputBlob);

          fileStorageKey =
            syllabusBuilderRequest.fileStorageKey ||
            syllabusBuilderRequest.requestId;

          await saveSyllabusEditorFilePayload(
            fileStorageKey,
            fileDataUrl
          );
        }

        const result:
          SyllabusBuilderEditorResult = {
          requestId:
            syllabusBuilderRequest.requestId,
          source: 'syllabus-builder',
          confirmed: true,
          targetType:
            syllabusBuilderRequest.targetType,
          content: activeValue.html,
          courseId:
            syllabusBuilderRequest.courseId,
          syllabusId:
            syllabusBuilderRequest.syllabusId,
          moduleId:
            syllabusBuilderRequest.moduleId,
          unitId:
            syllabusBuilderRequest.unitId,
          topicId:
            syllabusBuilderRequest.topicId,
          resourceId:
            syllabusBuilderRequest.resourceId,
          contentBlockId:
            syllabusBuilderRequest.contentBlockId,
          savedAt: new Date().toISOString(),
          outputFormat,
          fileName,
          mimeType,
          fileSize,
          fileDataUrl,
          fileStorageKey,
        };

        window.localStorage.removeItem(
          TEXT_EDITOR_RESULT_STORAGE_KEY
        );

        window.localStorage.setItem(
          TEXT_EDITOR_RESULT_STORAGE_KEY,
          JSON.stringify(result)
        );

        window.localStorage.removeItem(
          TEXT_EDITOR_REQUEST_STORAGE_KEY
        );

        setCurrentValue(activeValue);

        if (hasValidOnChange) {
          onChange?.(activeValue);
        }

        setSaveStatus('saved');

        returnToSyllabusBuilder(
          syllabusBuilderRequest
        );
      } catch (error) {
        console.error(
          'Unable to save and return the edited document:',
          error
        );

        window.alert(
          error instanceof Error
            ? error.message
            : 'Unable to save the edited document.'
        );
      }

      return;
    }

    saveSyllabusEditorToStorage('confirmed');

    window.alert('Syllabus creation completed.');

    goBackToPreviousEditorScreen();
  }



  useEffect(() => {
    if (!editor) {
      return;
    }

    const context = getSyllabusEditorContext();

    if (!context.isSyllabusMode || !context.structureType) {
      return;
    }

    const selectedTemplate = getAcademicTemplateFromSyllabusStructure(
      context.structureType
    );
    const loadedKey =
      `syllabus_editor_template_loaded_${context.courseId}_${context.syllabusId}_${context.structureType}`;
    const alreadyLoaded = window.localStorage.getItem(loadedKey) === 'true';
    const currentHtml = editor.getHTML();
    const currentText = getEditorPlainText(editor).trim();
    const hasSyllabusTemplateTable = currentHtml.includes(
      'data-syllabus-template-table="true"'
    );

    if (alreadyLoaded && currentText.length > 0) {
      return;
    }

    if (currentText.length > 0 && !hasSyllabusTemplateTable) {
      return;
    }

    const templateHtml = buildSyllabusDraftTableTemplate(
      context.structureType,
      aiContext,
      context.syllabusTitle,
      context.syllabusVersion
    );

    (editor.commands as any).setContent(templateHtml, true);

    const nextValue: AppTextEditorValue = {
      html: editor.getHTML(),
      plain_text: getEditorPlainText(editor),
      json_content: editor.getJSON(),
    };

    setCurrentValue(nextValue);

    if (hasValidOnChange) {
      onChange?.(nextValue);
    }

    setActiveRibbonTab('academic');
    window.localStorage.setItem(loadedKey, 'true');
    window.localStorage.setItem(
      `syllabus_editor_selected_template_${context.courseId}`,
      selectedTemplate
    );
  }, [
    editor,
    id,
    label,
    aiContext,
    hasValidOnChange,
    onChange,
  ]);








  function notifyEditorChange() {
    if (!editor) return;

    const nextValue: AppTextEditorValue = {
      html: editor.getHTML(),
      plain_text: getEditorPlainText(editor),
      json_content: editor.getJSON(),
    };

    setCurrentValue(nextValue);

    if (hasValidOnChange) {
      onChange?.(nextValue);
    }
  }

  function runAfterEditorStateUpdate(callback: () => void) {
    window.requestAnimationFrame(() => {
      callback();
    });
  }

  function isManualToolbarEntryTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;

    return Boolean(
      target.closest(
        [
          'input[type="text"]',
          'input[type="search"]',
          'input[type="number"]',
          'input[inputmode]',
          'textarea',
          '[contenteditable="true"]',
          '[data-manual-entry-input="true"]',
          '[data-manual-entry-root="true"]',
          `.${styles.toolbarInput}`,
          `.${styles.fontFamilySelect}`,
          `.${styles.fontSizeSelect}`,
        ].join(', ')
      )
    );
  }

  function shouldPreserveTopRibbonScrollFromTarget(
    target: EventTarget | null,
    currentTarget: EventTarget | null
  ) {
    if (!(target instanceof HTMLElement)) return false;
    if (target === currentTarget) return false;

    if (isManualToolbarEntryTarget(target)) {
      return false;
    }

    return Boolean(
      target.closest(
        'button, select, input[type="color"], [role="button"], [data-home-dropdown-root="true"], [data-home-dropdown-menu="true"]'
      )
    );
  }

  function holdTopRibbonScrollPosition() {
    toolbarScrollFreezeUntilRef.current = window.performance.now() + 700;

    if (toolbarScrollReleaseTimerRef.current !== null) {
      window.clearTimeout(toolbarScrollReleaseTimerRef.current);
    }

    toolbarScrollReleaseTimerRef.current = window.setTimeout(() => {
      toolbarScrollFreezeUntilRef.current = 0;
      toolbarScrollReleaseTimerRef.current = null;
    }, 760);
  }

  function rememberTopRibbonScroll() {
    const toolbarElement = toolbarScrollRef.current;
    if (!toolbarElement) return;

    toolbarScrollLeftRef.current = toolbarElement.scrollLeft;
    holdTopRibbonScrollPosition();
  }

  function forceTopRibbonScrollLeft(scrollLeft: number) {
    const toolbarElement = toolbarScrollRef.current;
    if (!toolbarElement) return;

    if (Math.abs(toolbarElement.scrollLeft - scrollLeft) > 1) {
      toolbarElement.scrollLeft = scrollLeft;
    }
  }

  function restoreTopRibbonScroll() {
    const requestedScrollLeft = toolbarScrollLeftRef.current;

    holdTopRibbonScrollPosition();

    if (toolbarScrollRestoreFrameRef.current !== null) {
      window.cancelAnimationFrame(toolbarScrollRestoreFrameRef.current);
    }

    toolbarScrollRestoreFrameRef.current = window.requestAnimationFrame(() => {
      forceTopRibbonScrollLeft(requestedScrollLeft);

      window.requestAnimationFrame(() => {
        forceTopRibbonScrollLeft(requestedScrollLeft);

        window.setTimeout(() => {
          forceTopRibbonScrollLeft(requestedScrollLeft);
        }, 0);

        window.setTimeout(() => {
          forceTopRibbonScrollLeft(requestedScrollLeft);
        }, 80);
      });
    });
  }

  function handleTopRibbonPointerDown(event: {
    target: EventTarget | null;
    currentTarget: EventTarget | null;
  }) {
    if (!shouldPreserveTopRibbonScrollFromTarget(event.target, event.currentTarget)) {
      return;
    }

    rememberTopRibbonScroll();
  }

  function handleTopRibbonFocus(event: {
    target: EventTarget | null;
    currentTarget: EventTarget | null;
  }) {
    if (isManualToolbarEntryTarget(event.target)) {
      return;
    }

    if (!shouldPreserveTopRibbonScrollFromTarget(event.target, event.currentTarget)) {
      return;
    }

    restoreTopRibbonScroll();
  }

  function handleTopRibbonClick(event: {
    target: EventTarget | null;
    currentTarget: EventTarget | null;
  }) {
    if (isManualToolbarEntryTarget(event.target)) {
      return;
    }

    if (!shouldPreserveTopRibbonScrollFromTarget(event.target, event.currentTarget)) {
      return;
    }

    restoreTopRibbonScroll();
  }

  function handleTopRibbonKeyDown(event: {
    key: string;
    target: EventTarget | null;
    currentTarget: EventTarget | null;
  }) {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    if (!shouldPreserveTopRibbonScrollFromTarget(event.target, event.currentTarget)) {
      return;
    }

    rememberTopRibbonScroll();
  }

  function handleTopRibbonKeyUp(event: {
    key: string;
    target: EventTarget | null;
    currentTarget: EventTarget | null;
  }) {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    if (!shouldPreserveTopRibbonScrollFromTarget(event.target, event.currentTarget)) {
      return;
    }

    restoreTopRibbonScroll();
  }

  function handleTopRibbonInputOrChange(event: {
    target: EventTarget | null;
    currentTarget: EventTarget | null;
  }) {
    if (isManualToolbarEntryTarget(event.target)) {
      return;
    }

    if (!shouldPreserveTopRibbonScrollFromTarget(event.target, event.currentTarget)) {
      return;
    }

    restoreTopRibbonScroll();
  }

  function handleTopRibbonScroll(event: { currentTarget: HTMLDivElement }) {
    const toolbarElement = event.currentTarget;
    const shouldHoldScroll =
      window.performance.now() < toolbarScrollFreezeUntilRef.current;

    if (shouldHoldScroll) {
      forceTopRibbonScrollLeft(toolbarScrollLeftRef.current);
      return;
    }

    toolbarScrollLeftRef.current = toolbarElement.scrollLeft;
  }

  function resolveFontFamilyInput(inputValue: string) {
    const trimmedValue = inputValue.trim();

    if (!trimmedValue) return '';

    const matchedOption = fontFamilyOptions.find((option) => {
      return (
        option.label.toLowerCase() === trimmedValue.toLowerCase() ||
        option.value.toLowerCase() === trimmedValue.toLowerCase()
      );
    });

    if (matchedOption) return matchedOption.value;

    if (
      trimmedValue.includes(',') ||
      trimmedValue.includes('"') ||
      trimmedValue.includes("'")
    ) {
      return trimmedValue;
    }

    return `"${trimmedValue}", sans-serif`;
  }

  function applyFontFamilyInput(inputValue = fontFamilyInput) {
    if (!editor) return;

    const trimmedValue = inputValue.trim();
    const resolvedFontFamily = resolveFontFamilyInput(trimmedValue);

    if (!resolvedFontFamily) return;

    (editor.chain().focus() as any).setFontFamily(resolvedFontFamily).run();
    setFontFamilyInput(trimmedValue);
    notifyEditorChange();
  }

  function resolveFontSizeInput(inputValue: string) {
    const trimmedValue = inputValue.trim();

    if (!trimmedValue) return '';

    const numericValue = Number.parseFloat(trimmedValue.replace('px', ''));

    if (Number.isNaN(numericValue)) return '';

    const safeSize = Math.min(120, Math.max(6, numericValue));

    return `${safeSize}px`;
  }

  function applyFontSizeInput(inputValue = fontSizeInput) {
    if (!editor) return;

    const resolvedFontSize = resolveFontSizeInput(inputValue);

    if (!resolvedFontSize) return;

    (editor.chain().focus() as any).setFontSize(resolvedFontSize).run();
    setFontSizeInput(resolvedFontSize.replace('px', ''));
    notifyEditorChange();
  }

  function applyFontSize(fontSize: string) {
    if (!editor) return;

    const resolvedFontSize = resolveFontSizeInput(fontSize);

    if (!resolvedFontSize) return;

    (editor.chain().focus() as any).setFontSize(resolvedFontSize).run();
    setFontSizeInput(resolvedFontSize.replace('px', ''));
    notifyEditorChange();
  }


  function normalizeToolbarFontFamilyValue(rawValue: unknown) {
    const fontFamily = String(rawValue || '')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();

    if (!fontFamily) return '';

    const matchedOption = fontFamilyOptions.find((option) => {
      const normalizedOptionValue = option.value.replace(/["']/g, '').toLowerCase();
      const normalizedOptionLabel = option.label.replace(/["']/g, '').toLowerCase();
      const normalizedFontFamily = fontFamily.replace(/["']/g, '').toLowerCase();

      return (
        normalizedFontFamily === normalizedOptionValue ||
        normalizedFontFamily === normalizedOptionLabel ||
        normalizedFontFamily.startsWith(`${normalizedOptionLabel},`) ||
        normalizedFontFamily.includes(normalizedOptionLabel)
      );
    });

    return matchedOption?.label || fontFamily.split(',')[0].replace(/["']/g, '').trim();
  }

  function normalizeToolbarFontSizeValue(rawValue: unknown) {
    const fontSize = String(rawValue || '').trim();

    if (!fontSize) return '';

    const parsed = Number.parseFloat(fontSize.replace('px', ''));

    if (Number.isNaN(parsed)) return '';

    return String(Math.round(parsed));
  }

  function getCurrentSelectionElement(activeEditor: TiptapEditor) {
    const view = activeEditor.view;
    const selection = view.state.selection;
    const positions = [selection.from, selection.to, selection.$from.pos, selection.$to.pos];

    for (const position of positions) {
      try {
        const domAtPosition = view.domAtPos(Math.max(0, Math.min(position, view.state.doc.content.size)));
        const node = domAtPosition.node;
        const element =
          node instanceof HTMLElement
            ? node
            : node.parentElement;

        if (element && view.dom.contains(element)) {
          return element.closest('[style], span, p, h1, h2, h3, h4, h5, h6, li, td, th') as HTMLElement | null || element;
        }
      } catch {
        // Ignore invalid DOM positions and continue with the next possible point.
      }
    }

    const nativeSelection = view.dom.ownerDocument.getSelection();
    const anchorNode = nativeSelection?.anchorNode || null;

    if (anchorNode && view.dom.contains(anchorNode)) {
      return anchorNode instanceof HTMLElement ? anchorNode : anchorNode.parentElement;
    }

    return null;
  }

  function syncHomeFontToolbarFromSelection(activeEditor: TiptapEditor) {
    const textStyleAttrs = activeEditor.getAttributes('textStyle') || {};
    let nextFontFamily = normalizeToolbarFontFamilyValue(textStyleAttrs.fontFamily);
    let nextFontSize = normalizeToolbarFontSizeValue(textStyleAttrs.fontSize);

    const currentElement = getCurrentSelectionElement(activeEditor);

    if (currentElement) {
      const inlineFontFamily = currentElement.style?.fontFamily || '';
      const inlineFontSize = currentElement.style?.fontSize || '';
      const computedStyle = window.getComputedStyle(currentElement);

      if (!nextFontFamily) {
        nextFontFamily = normalizeToolbarFontFamilyValue(
          inlineFontFamily || computedStyle.fontFamily
        );
      }

      if (!nextFontSize) {
        nextFontSize = normalizeToolbarFontSizeValue(
          inlineFontSize || computedStyle.fontSize
        );
      }
    }

    setFontFamilyInput(nextFontFamily || '');
    setFontSizeInput(nextFontSize || '');
  }

  function setSelectedBlockLineHeight(
    lineHeight: string | null,
    shouldNotify = true
  ) {
    if (!editor) return false;

    const { state, view } = editor;
    const { selection } = state;
    const transaction = state.tr;
    const supportedNodeTypes = new Set(['paragraph', 'heading']);
    let didUpdate = false;

    function updateTextBlockNode(node: any, position: number) {
      if (!node.isTextblock || !supportedNodeTypes.has(node.type.name)) return;
      if (node.attrs.lineHeight === lineHeight) return;

      transaction.setNodeMarkup(
        position,
        undefined,
        {
          ...node.attrs,
          lineHeight,
        },
        node.marks
      );

      didUpdate = true;
    }

    if (selection.empty) {
      const { $from } = selection;

      for (let depth = $from.depth; depth > 0; depth -= 1) {
        const node = $from.node(depth);

        if (node.isTextblock && supportedNodeTypes.has(node.type.name)) {
          updateTextBlockNode(node, $from.before(depth));
          break;
        }
      }
    } else {
      state.doc.nodesBetween(selection.from, selection.to, (node, position) => {
        if (node.isTextblock && supportedNodeTypes.has(node.type.name)) {
          updateTextBlockNode(node, position);
        }
      });
    }

    if (!didUpdate) return false;

    view.dispatch(transaction.scrollIntoView());

    if (shouldNotify) {
      notifyEditorChange();
    }

    return true;
  }

  function applyLineSpacing(value: string) {
    if (!editor || !value) return;

    editor.chain().focus().run();
    setSelectedBlockLineHeight(value);
  }

  function applyCustomTextColor() {
    if (!editor || !customTextColor) return;
    editor.chain().focus().setColor(customTextColor).run();
    notifyEditorChange();
  }

  function applyCustomHighlightColor() {
    if (!editor || !customHighlightColor) return;

    editor.chain().focus().setHighlight({
      color: customHighlightColor,
    }).run();

    notifyEditorChange();
  }

  function getCurrentFontSizeNumber() {
    if (!editor) return 14;

    const fontSize = editor.getAttributes('textStyle').fontSize;

    if (!fontSize || typeof fontSize !== 'string') return 14;

    const parsed = Number.parseInt(fontSize.replace('px', ''), 10);

    return Number.isNaN(parsed) ? 14 : parsed;
  }

  function changeFontSize(delta: number) {
    if (!editor) return;

    const nextSize = Math.min(120, Math.max(6, getCurrentFontSizeNumber() + delta));

    (editor.chain().focus() as any).setFontSize(`${nextSize}px`).run();
    setFontSizeInput(String(nextSize));
    notifyEditorChange();
  }

  function applyListNodeStyle(
    nodeName: 'bulletList' | 'orderedList',
    listStyleType: string
  ) {
    if (!editor) return;

    const { state, view } = editor;
    const touchedPositions = new Set<number>();

    let transaction = state.tr;
    let hasUpdatedNode = false;

    const markNodeForUpdate = (
      nodePosition: number,
      nodeAttrs: Record<string, unknown>
    ) => {
      if (touchedPositions.has(nodePosition)) return;

      touchedPositions.add(nodePosition);

      transaction = transaction.setNodeMarkup(nodePosition, undefined, {
        ...nodeAttrs,
        listStyleType,
      });

      hasUpdatedNode = true;
    };

    state.doc.nodesBetween(state.selection.from, state.selection.to, (node, position) => {
      if (node.type.name !== nodeName) return;
      markNodeForUpdate(position, node.attrs);
    });

    const { $from } = state.selection;

    for (let depth = $from.depth; depth > 0; depth -= 1) {
      const node = $from.node(depth);

      if (node.type.name === nodeName) {
        markNodeForUpdate($from.before(depth), node.attrs);
      }
    }

    if (hasUpdatedNode) {
      view.dispatch(transaction);
      notifyEditorChange();
      return;
    }

    (editor.chain().focus() as any)
      .updateAttributes(nodeName, {
        listStyleType,
      })
      .run();

    notifyEditorChange();
  }

  function applyBulletStyle(listStyleType: string) {
    if (!editor) return;

    setSelectedBulletStyleValue(listStyleType);

    if (!editor.isActive('bulletList')) {
      editor.chain().focus().toggleBulletList().run();
    }

    runAfterEditorStateUpdate(() => {
      applyListNodeStyle('bulletList', listStyleType);
    });
  }


  function applyOrderedListStyle(listStyleType: string) {
    if (!editor) return;

    setSelectedNumberStyleValue(listStyleType);

    if (!editor.isActive('orderedList')) {
      editor.chain().focus().toggleOrderedList().run();
    }

    runAfterEditorStateUpdate(() => {
      applyListNodeStyle('orderedList', listStyleType);
    });
  }

  function toggleChecklist() {
    if (!editor) return;

    setSelectedBulletStyleValue('check');

    if (editor.isActive('taskList')) {
      editor.chain().focus().toggleTaskList().run();
    }

    if (!editor.isActive('bulletList')) {
      editor.chain().focus().toggleBulletList().run();
    }

    runAfterEditorStateUpdate(() => {
      applyListNodeStyle('bulletList', 'check');
    });
  }

  function getSelectionHasAncestorNode(nodeName: string) {
    if (!editor) return false;

    const { selection } = editor.state;

    const hasAncestor = (position: typeof selection.$from) => {
      for (let depth = position.depth; depth > 0; depth -= 1) {
        if (position.node(depth).type.name === nodeName) {
          return true;
        }
      }

      return false;
    };

    return hasAncestor(selection.$from) || hasAncestor(selection.$to);
  }

  function insertQuoteFallback() {
    if (!editor) return;

    const activeValue = getLatestValue();

    if (!activeValue.plain_text.trim()) {
      editor.chain().focus().insertContent('<p>Quote text</p>').run();
      notifyEditorChange();
      return;
    }

    editor.chain().focus().insertContent('“Quoted text”').run();
    notifyEditorChange();
  }

  function toggleQuoteBlock() {
    if (!editor) return;

    const activeValue = getLatestValue();

    try {
      if (!activeValue.plain_text.trim()) {
        editor
          .chain()
          .focus()
          .insertContent('<blockquote><p>Quote text</p></blockquote>')
          .run();

        notifyEditorChange();
        return;
      }

      const commandResult = editor.chain().focus().toggleBlockquote().run();

      if (!commandResult && getSelectionHasAncestorNode('textBoxCallout')) {
        insertQuoteFallback();
        return;
      }

      notifyEditorChange();
    } catch {
      insertQuoteFallback();
    }
  }

  function indentSelectedTextBlocks() {
    if (!editor) return;

    const { state, view } = editor;
    const { from, to } = state.selection;
    const tr = state.tr;
    const indentText = '\u00a0\u00a0\u00a0\u00a0';

    state.doc.nodesBetween(from, to, (node, position) => {
      if (!node.isTextblock || node.type.name === 'codeBlock') return;

      const mappedPosition = tr.mapping.map(position + 1);
      tr.insertText(indentText, mappedPosition, mappedPosition);
    });

    if (tr.docChanged) {
      view.dispatch(tr.scrollIntoView());
      notifyEditorChange();
    }
  }

  function outdentSelectedTextBlocks() {
    if (!editor) return;

    const { state, view } = editor;
    const { from, to } = state.selection;
    const tr = state.tr;

    state.doc.nodesBetween(from, to, (node, position) => {
      if (!node.isTextblock || node.type.name === 'codeBlock') return;

      const leadingMatch = node.textContent.match(/^(\u00a0{1,4}| {1,4}|\t)/);

      if (!leadingMatch) return;

      const mappedStart = tr.mapping.map(position + 1);
      const mappedEnd = tr.mapping.map(position + 1 + leadingMatch[0].length);
      tr.delete(mappedStart, mappedEnd);
    });

    if (tr.docChanged) {
      view.dispatch(tr.scrollIntoView());
      notifyEditorChange();
    }
  }

  function indentListItem() {
    if (!editor) return;

    const commandChain = editor.chain().focus() as any;

    try {
      if (editor.isActive('taskItem')) {
        const commandResult = commandChain.sinkListItem('taskItem').run();

        if (commandResult) {
          notifyEditorChange();
          return;
        }
      }

      if (editor.isActive('listItem')) {
        const commandResult = commandChain.sinkListItem('listItem').run();

        if (commandResult) {
          notifyEditorChange();
          return;
        }
      }
    } catch {
      indentSelectedTextBlocks();
      return;
    }

    indentSelectedTextBlocks();
  }

  function outdentListItem() {
    if (!editor) return;

    const commandChain = editor.chain().focus() as any;

    try {
      if (editor.isActive('taskItem')) {
        const commandResult = commandChain.liftListItem('taskItem').run();

        if (commandResult) {
          notifyEditorChange();
          return;
        }
      }

      if (editor.isActive('listItem')) {
        const commandResult = commandChain.liftListItem('listItem').run();

        if (commandResult) {
          notifyEditorChange();
          return;
        }
      }
    } catch {
      outdentSelectedTextBlocks();
      return;
    }

    outdentSelectedTextBlocks();
  }

  function applyParagraphPreset(preset: string) {
    if (!editor) return;

    const { selection } = editor.state;
    const selectionInsideTextBoxCallout = (() => {
      const checkPosition = (position: typeof selection.$from) => {
        for (let depth = position.depth; depth > 0; depth -= 1) {
          if (position.node(depth).type.name === 'textBoxCallout') {
            return true;
          }
        }

        return false;
      };

      return checkPosition(selection.$from) || checkPosition(selection.$to);
    })();

    if (preset === 'normal') {
      try {
        const chain = (editor.chain().focus() as any).unsetFontSize();

        if (!selectionInsideTextBoxCallout) {
          chain.setParagraph();
        }

        chain.run();
      } catch {
        (editor.chain().focus() as any).unsetFontSize().run();
      }

      setSelectedBlockLineHeight(null, false);
      notifyEditorChange();
      return;
    }

    const presetMap: Record<string, { fontSize: string; lineHeight: string }> = {
      lead: {
        fontSize: '20px',
        lineHeight: '1.6',
      },
      small: {
        fontSize: '12px',
        lineHeight: '1.35',
      },
      caption: {
        fontSize: '11px',
        lineHeight: '1.3',
      },
    };

    const selectedPreset = presetMap[preset];

    if (!selectedPreset) return;

    try {
      const chain = (editor.chain().focus() as any).setFontSize(selectedPreset.fontSize);

      if (!selectionInsideTextBoxCallout) {
        chain.setParagraph();
      }

      chain.run();
    } catch {
      (editor.chain().focus() as any).setFontSize(selectedPreset.fontSize).run();
    }

    setSelectedBlockLineHeight(selectedPreset.lineHeight, false);
    notifyEditorChange();
  }

  function transformSelectedText(transformType: string) {
    if (!editor) return;

    const selection = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(selection.from, selection.to, ' ');

    if (!selectedText.trim()) return;

    const transformedText = (() => {
      if (transformType === 'upper') return selectedText.toUpperCase();
      if (transformType === 'lower') return selectedText.toLowerCase();

      if (transformType === 'title') {
        return selectedText
          .toLowerCase()
          .replace(/\b\w/g, (character) => character.toUpperCase());
      }

      if (transformType === 'sentence') {
        const lowerText = selectedText.toLowerCase();

        return lowerText.replace(/(^\s*\w|[.!?]\s+\w)/g, (character) =>
          character.toUpperCase()
        );
      }

      return selectedText;
    })();

    editor.chain().focus().insertContent(escapeHtml(transformedText)).run();
    notifyEditorChange();
  }

  function clearTextStyle() {
    if (!editor) return;

    const { selection } = editor.state;
    const selectionInsideTextBoxCallout = (() => {
      const checkPosition = (position: typeof selection.$from) => {
        for (let depth = position.depth; depth > 0; depth -= 1) {
          if (position.node(depth).type.name === 'textBoxCallout') {
            return true;
          }
        }

        return false;
      };

      return checkPosition(selection.$from) || checkPosition(selection.$to);
    })();

    try {
      const clearFormattingChain = (editor.chain().focus() as any)
        .unsetColor()
        .unsetFontFamily()
        .unsetFontSize()
        .unsetHighlight()
        .unsetAllMarks();

      if (!selectionInsideTextBoxCallout) {
        clearFormattingChain.clearNodes();
      }

      clearFormattingChain.run();
    } catch {
      (editor.chain().focus() as any)
        .unsetColor()
        .unsetFontFamily()
        .unsetFontSize()
        .unsetHighlight()
        .unsetAllMarks()
        .run();
    }

    setSelectedBlockLineHeight(null, false);

    setFontFamilyInput('');
    setFontSizeInput('');
    notifyEditorChange();
  }

  function getEditorBookmarks() {
    if (!editor) return [] as EditorBookmark[];

    const bookmarks: EditorBookmark[] = [];
    const usedBookmarkIds = new Set<string>();

    editor.state.doc.descendants((node, position) => {
      if (node.type.name !== 'bookmarkAnchor') return true;

      const bookmarkId = String(node.attrs.id || '').trim();
      const bookmarkName = String(node.attrs.name || bookmarkId || 'Bookmark').trim();

      if (!bookmarkId || usedBookmarkIds.has(bookmarkId)) return false;

      usedBookmarkIds.add(bookmarkId);
      bookmarks.push({
        id: bookmarkId,
        name: bookmarkName || bookmarkId,
        position,
      });

      return false;
    });

    return bookmarks;
  }

  function insertLink() {
    if (!editor) return;

    const previousUrl = String(editor.getAttributes('link').href || '');
    const rawUrl = window.prompt('URL link:', previousUrl);

    if (rawUrl === null) return;

    if (rawUrl.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      notifyEditorChange();
      return;
    }

    const href = normalizeHyperlinkHref(rawUrl);

    if (!href) return;

    const selectedText = getEditorSelectionText(editor);

    if (!selectedText) {
      const suggestedText = href.replace(/^https?:\/\//i, '');
      const displayText = window.prompt('Display text:', suggestedText);

      if (displayText === null || !displayText.trim()) return;

      editor
        .chain()
        .focus()
        .insertContent(
          `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(displayText.trim())}</a>&nbsp;`
        )
        .run();

      notifyEditorChange();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({
        href,
        target: '_blank',
        rel: 'noopener noreferrer',
      })
      .run();

    notifyEditorChange();
  }

  function insertBookmark() {
    if (!editor) return;

    const selectedText = getEditorSelectionText(editor);
    const existingBookmarks = getEditorBookmarks();
    const defaultBookmarkName = selectedText || `Bookmark ${existingBookmarks.length + 1}`;
    const name = window.prompt('Bookmark name:', defaultBookmarkName);

    if (name === null || !name.trim()) return;

    const bookmarkName = name.trim();
    const bookmarkId = createUniqueBookmarkId(
      bookmarkName,
      existingBookmarks.map((bookmark) => bookmark.id)
    );

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'bookmarkAnchor',
        attrs: {
          id: bookmarkId,
          name: bookmarkName,
        },
      })
      .insertContent(' ')
      .run();

    notifyEditorChange();
  }

  function insertCrossReference() {
    if (!editor) return;

    const bookmarks = getEditorBookmarks();

    if (!bookmarks.length) {
      window.alert('No bookmarks found. Insert a bookmark first.');
      return;
    }

    const bookmarkList = bookmarks
      .map((bookmark, index) => `${index + 1}. ${bookmark.name} (#${bookmark.id})`)
      .join('\n');

    const choice = window.prompt(
      `Select bookmark by number or ID:\n${bookmarkList}`,
      bookmarks[0]?.id || ''
    );

    if (choice === null || !choice.trim()) return;

    const requestedBookmark = choice.trim();
    const bookmarkIndex = Number.parseInt(requestedBookmark, 10);
    const selectedBookmark = Number.isFinite(bookmarkIndex) && bookmarkIndex > 0
      ? bookmarks[bookmarkIndex - 1]
      : bookmarks.find(
          (bookmark) =>
            bookmark.id.toLowerCase() === requestedBookmark.toLowerCase() ||
            bookmark.name.toLowerCase() === requestedBookmark.toLowerCase()
        );

    if (!selectedBookmark) {
      window.alert('Bookmark not found.');
      return;
    }

    const selectedText = getEditorSelectionText(editor);
    const crossReferenceText = window.prompt(
      'Cross-reference text:',
      selectedText || `See ${selectedBookmark.name}`
    );

    if (crossReferenceText === null || !crossReferenceText.trim()) return;

    editor
      .chain()
      .focus()
      .insertContent(
        `<a href="#${escapeHtml(selectedBookmark.id)}" data-cross-reference="true" title="Go to bookmark: ${escapeHtml(selectedBookmark.name)}">${escapeHtml(crossReferenceText.trim())}</a>&nbsp;`
      )
      .run();

    notifyEditorChange();
  }

  function insertOnlineVideo() {
    setOnlineVideoUrl('');
    setOnlineVideoTitle('');
    setIsOnlineVideoDialogOpen(true);
  }

  function closeOnlineVideoDialog() {
    setIsOnlineVideoDialogOpen(false);
    setOnlineVideoUrl('');
    setOnlineVideoTitle('');
  }

  function confirmOnlineVideoInsert() {
    const embedInfo = getOnlineVideoEmbedInfo(onlineVideoUrl);

    if (!embedInfo) return;

    const title = onlineVideoTitle.trim() || embedInfo.title;

    insertDocumentContent({
      type: 'onlineVideo',
      attrs: {
        src: embedInfo.src,
        originalUrl: embedInfo.originalUrl,
        kind: embedInfo.kind,
        provider: embedInfo.provider,
        title,
      },
    });

    closeOnlineVideoDialog();
  }


  function insertHtml(html: string) {
    if (!editor) return;
    editor.chain().focus().insertContent(html).run();
    notifyEditorChange();
  }

  function insertPromptedBlock(title: string, defaultText = '') {
    const text = window.prompt(`${title}:`, defaultText);
    if (text === null) return;
    insertHtml(`<p>${escapeHtml(text)}</p>`);
  }

  function insertDocumentContent(content: any) {
    if (!editor) return;
    editor.chain().focus().insertContent(content).run();
    notifyEditorChange();
  }

  function createDocumentUtilityParagraph(
    documentUtilityType: string,
    text = '',
    documentUtilityStyle = ''
  ) {
    const paragraph: Record<string, unknown> = {
      type: 'paragraph',
      attrs: {
        documentUtilityType,
        documentUtilityStyle: documentUtilityStyle || null,
      },
    };

    if (text) {
      paragraph.content = [{ type: 'text', text }];
    }

    return paragraph;
  }

  function createDocumentUtilityParagraphHtml(
    documentUtilityType: string,
    text = '',
    documentUtilityStyle = ''
  ) {
    const safeStyle = documentUtilityStyle || '';

    return `<p data-document-utility-type="${escapeHtml(documentUtilityType)}" data-document-utility-style="${escapeHtml(safeStyle)}" style="${escapeHtml(safeStyle)}">${escapeHtml(text)}</p>`;
  }

  function replaceDocumentUtilityBlock(
    documentUtilityType: string,
    blockHtml: string,
    placement: 'start' | 'end' = 'start'
  ) {
    if (!editor) return;

    const cleanedHtml =
      stripDocumentUtilityBlocks(editor.getHTML(), documentUtilityType).trim() || '<p></p>';
    const nextHtml =
      placement === 'start' ? `${blockHtml}${cleanedHtml}` : `${cleanedHtml}${blockHtml}`;

    (editor.commands as any).setContent(nextHtml, true);
    notifyEditorChange();
  }

  function createDocumentUtilityHeading(
    level: 1 | 2 | 3 | 4 | 5 | 6,
    documentUtilityType: string,
    text: string,
    documentUtilityStyle = ''
  ) {
    return {
      type: 'heading',
      attrs: {
        level,
        documentUtilityType,
        documentUtilityStyle: documentUtilityStyle || null,
      },
      content: [{ type: 'text', text }],
    };
  }

  function createSmallEditorMarkerText(labelText: string) {
    return `________________________ ${labelText} ________________________`;
  }

  function createSmallEditorMarkerStyle(
    accent = '#1d4ed8',
    includePageBreak = false
  ) {
    return [
      'display: block',
      includePageBreak ? 'break-after: page' : '',
      includePageBreak ? 'page-break-after: always' : '',
      'height: auto',
      'min-height: 0',
      'margin: 10px 0',
      'padding: 0',
      'border: 0',
      'background: transparent',
      `color: ${accent}`,
      'font-size: 11px',
      'font-weight: 800',
      'line-height: 16px',
      'letter-spacing: 0.01em',
      'text-align: center',
      'text-transform: none',
      'white-space: normal',
      'max-width: 100%',
      'overflow-wrap: anywhere',
      'word-break: break-word',
    ]
      .filter(Boolean)
      .join('; ');
  }

  function createHiddenDocumentUtilityStyle(includePageBreak = false) {
    return [
      includePageBreak ? 'break-after: page' : '',
      includePageBreak ? 'page-break-after: always' : '',
      'height: 0',
      'min-height: 0',
      'max-height: 0',
      'margin: 0',
      'padding: 0',
      'border: 0',
      'font-size: 0',
      'line-height: 0',
      'overflow: hidden',
      'color: transparent',
    ]
      .filter(Boolean)
      .join('; ');
  }

  function getNextDocumentUtilityNumber(documentUtilityType: string) {
    if (!editor) return 1;

    const html = editor.getHTML();
    const escapedType = documentUtilityType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = html.match(
      new RegExp(`data-document-utility-type=["']${escapedType}["']`, 'gi')
    );

    return (matches?.length || 0) + 1;
  }

  function createPageBreakParagraph(
    markerText = '',
    accent = '#1d4ed8'
  ) {
    return createDocumentUtilityParagraph(
      'page-break',
      markerText,
      markerText
        ? createSmallEditorMarkerStyle(accent, true)
        : createHiddenDocumentUtilityStyle(true)
    );
  }

  function createPageStartMarkerParagraph(
    documentUtilityType: 'page-break-body-start' | 'blank-page-body-start' | 'cover-page-body-start',
    text: string,
    accent = '#0f766e'
  ) {
    return createDocumentUtilityParagraph(
      documentUtilityType,
      text,
      createSmallEditorMarkerStyle(accent)
    );
  }

  function createBlankPageMarkerParagraph() {
    return createDocumentUtilityParagraph(
      'blank-page',
      '',
      createHiddenDocumentUtilityStyle(true)
    );
  }

  function createEditableEmptyParagraph() {
    return {
      type: 'paragraph',
    };
  }

  function getTodayLabel() {
    return new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function createEditableTableContent(rows: number, cols: number) {
    const safeRows = Math.min(20, Math.max(1, Number(rows) || 3));
    const safeCols = Math.min(12, Math.max(1, Number(cols) || 3));

    return {
      type: 'table',
      content: Array.from({ length: safeRows }, (_rowValue, rowIndex) => ({
        type: 'tableRow',
        content: Array.from({ length: safeCols }, (_cellValue, colIndex) => ({
          type: rowIndex === 0 ? 'tableHeader' : 'tableCell',
          content: [
            {
              type: 'paragraph',
              content:
                rowIndex === 0
                  ? [
                      {
                        type: 'text',
                        text: `Header ${colIndex + 1}`,
                      },
                    ]
                  : [],
            },
          ],
        })),
      })),
    };
  }

  function editorHasTable(activeEditor: TiptapEditor | null) {
    if (!activeEditor) return false;

    let foundTable = false;

    activeEditor.state.doc.descendants((node) => {
      if (node.type.name === 'table') {
        foundTable = true;
        return false;
      }

      return true;
    });

    return foundTable;
  }

  function getActiveTableSelectionPosition() {
    if (!editor) return null;

    const { selection } = editor.state;
    const { $from } = selection;

    for (let depth = $from.depth; depth > 0; depth -= 1) {
      const nodeName = $from.node(depth).type.name;

      if (nodeName === 'tableCell' || nodeName === 'tableHeader') {
        return selection.from;
      }
    }

    return null;
  }

  function isSelectionInsideTable() {
    return getActiveTableSelectionPosition() !== null;
  }

  function getFirstTextPositionInsideTable() {
    if (!editor) return null;

    let selectionPosition: number | null = null;

    editor.state.doc.descendants((node, pos) => {
      if (selectionPosition !== null) return false;

      if (node.type.name !== 'tableCell' && node.type.name !== 'tableHeader') {
        return true;
      }

      node.descendants((childNode, relativePos) => {
        if (selectionPosition !== null) return false;

        if (childNode.isTextblock) {
          selectionPosition = pos + relativePos + 1;
          return false;
        }

        return true;
      });

      return selectionPosition === null;
    });

    return selectionPosition;
  }

  function getLastTableSelectionPosition() {
    if (!editor) return null;

    let selectionPosition: number | null = null;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name !== 'tableCell' && node.type.name !== 'tableHeader') {
        return true;
      }

      node.descendants((childNode, relativePos) => {
        if (childNode.isTextblock) {
          selectionPosition = pos + relativePos + 1;
          return false;
        }

        return true;
      });

      return true;
    });

    return selectionPosition ?? getFirstTextPositionInsideTable();
  }

  function setTableSelectionPosition(selectionPosition: number | null) {
    if (!editor || selectionPosition === null) return false;

    const documentSize = editor.state.doc.content.size;
    const firstTableTextPosition = getFirstTextPositionInsideTable();

    const candidatePositions = [
      selectionPosition,
      selectionPosition + 1,
      selectionPosition - 1,
      selectionPosition + 2,
      selectionPosition - 2,
      selectionPosition + 3,
      selectionPosition - 3,
      firstTableTextPosition,
    ].filter(
      (position): position is number =>
        typeof position === 'number' &&
        position > 0 &&
        position < documentSize
    );

    for (const candidatePosition of candidatePositions) {
      try {
        const resolvedPosition = editor.state.doc.resolve(candidatePosition);
        const nextSelection = TextSelection.near(resolvedPosition, 1);
        const transaction = editor.state.tr
          .setSelection(nextSelection)
          .scrollIntoView();

        editor.view.dispatch(transaction);
        editor.view.focus();

        const activeTablePosition = getActiveTableSelectionPosition();

        if (activeTablePosition !== null || editor.isActive('table')) {
          lastTableCellSelectionRef.current =
            activeTablePosition ?? nextSelection.from;
          return true;
        }
      } catch {
        // Try the next nearby position.
      }
    }

    return false;
  }

  function ensureSelectionInsideTable() {
    if (!editor || !editorHasTable(editor)) return false;

    const activeTablePosition = getActiveTableSelectionPosition();

    if (activeTablePosition !== null) {
      lastTableCellSelectionRef.current = activeTablePosition;
      editor.view.focus();
      return true;
    }

    return setTableSelectionPosition(
      lastTableCellSelectionRef.current ?? getLastTableSelectionPosition()
    );
  }

  function focusLastTableCell() {
    if (!editor || !editorHasTable(editor)) return false;

    const targetPosition =
      lastTableCellSelectionRef.current ?? getLastTableSelectionPosition();

    return setTableSelectionPosition(targetPosition);
  }


  function getEditorRootElement() {
    if (!editor) return null;

    return editor.view.dom as HTMLElement;
  }

  function getDomTableCellSnapshot(cellElement: HTMLTableCellElement) {
    const rootElement = getEditorRootElement();
    const tableElement = cellElement.closest('table');

    if (!rootElement || !tableElement || !rootElement.contains(tableElement)) {
      return null;
    }

    const tableIndex = Array.from(rootElement.querySelectorAll('table')).indexOf(tableElement);

    if (tableIndex < 0) return null;

    const rowElement = cellElement.parentElement as HTMLTableRowElement | null;

    if (!rowElement) return null;

    const tableRows = Array.from(tableElement.querySelectorAll('tr'));
    const rowIndex = tableRows.indexOf(rowElement);
    const rowCells = Array.from(rowElement.children).filter((child) => {
      return child instanceof HTMLTableCellElement;
    }) as HTMLTableCellElement[];
    const cellIndex = rowCells.indexOf(cellElement);

    if (rowIndex < 0 || cellIndex < 0) return null;

    return {
      tableIndex,
      rowIndex,
      cellIndex,
    };
  }

  function rememberDomTableCell(target?: EventTarget | null) {
    if (!editor) return null;

    const rootElement = getEditorRootElement();

    if (!rootElement) return null;

    const candidateElements: HTMLElement[] = [];

    if (target instanceof HTMLElement) {
      candidateElements.push(target);
    }

    const activeElement = document.activeElement;

    if (activeElement instanceof HTMLElement) {
      candidateElements.push(activeElement);
    }

    const selection = document.getSelection();
    const anchorNode = selection?.anchorNode;

    if (anchorNode) {
      const anchorElement =
        anchorNode instanceof HTMLElement ? anchorNode : anchorNode.parentElement;

      if (anchorElement) {
        candidateElements.push(anchorElement);
      }
    }

    for (const candidateElement of candidateElements) {
      if (!rootElement.contains(candidateElement)) continue;

      const cellElement = candidateElement.closest('td, th') as HTMLTableCellElement | null;

      if (!cellElement || !rootElement.contains(cellElement)) continue;

      const snapshot = getDomTableCellSnapshot(cellElement);

      if (snapshot) {
        lastTableDomSelectionRef.current = snapshot;
        return snapshot;
      }
    }

    return null;
  }

  function getDomTableCellFromSnapshot(snapshot: TableDomSelectionSnapshot | null) {
    if (!editor || !snapshot) return null;

    const rootElement = getEditorRootElement();

    if (!rootElement) return null;

    const tableElement = rootElement.querySelectorAll('table')[snapshot.tableIndex] as HTMLTableElement | undefined;

    if (!tableElement) return null;

    const rowElement = tableElement.querySelectorAll('tr')[snapshot.rowIndex] as HTMLTableRowElement | undefined;

    if (!rowElement) return null;

    const cells = Array.from(rowElement.children).filter((child) => {
      return child instanceof HTMLTableCellElement;
    }) as HTMLTableCellElement[];

    return cells[snapshot.cellIndex] || cells[cells.length - 1] || null;
  }

  function getTableSnapshotForDomFallback() {
    return rememberDomTableCell() || lastTableDomSelectionRef.current;
  }

  function createEmptyTableCellHtml(tagName: 'td' | 'th') {
    return `<${tagName}><p></p></${tagName}>`;
  }

  function normalizeTableRowCells(rowElement: HTMLTableRowElement) {
    return Array.from(rowElement.children).filter((child) => {
      return child instanceof HTMLTableCellElement;
    }) as HTMLTableCellElement[];
  }

  function runProseMirrorTableCommandFallback(commandName: string) {
    if (!editor || !editorHasTable(editor)) return false;

    const safeEditor = editor;

    type TableContext = {
      tableNode: any;
      tablePos: number;
      rowIndex: number;
      cellIndex: number;
    };

    function getContextFromPosition(position: number | null): TableContext | null {
      if (!editor || typeof position !== 'number') return null;

      const localEditor = editor;
      let context: TableContext | null = null;

      localEditor.state.doc.descendants((node, pos) => {
        if (context) return false;
        if (node.type.name !== 'table') return true;

        let matchedRowIndex = -1;
        let matchedCellIndex = -1;

        node.forEach((rowNode: any, rowOffset: number, rowIndex: number) => {
          if (matchedRowIndex >= 0) return;
          if (rowNode.type.name !== 'tableRow') return;

          const rowPos = pos + 1 + rowOffset;

          rowNode.forEach((cellNode: any, cellOffset: number, cellIndex: number) => {
            if (matchedRowIndex >= 0) return;

            const isTableCell =
              cellNode.type.name === 'tableCell' ||
              cellNode.type.name === 'tableHeader';

            if (!isTableCell) return;

            const cellPos = rowPos + 1 + cellOffset;
            const cellEnd = cellPos + cellNode.nodeSize;

            if (position >= cellPos && position <= cellEnd) {
              matchedRowIndex = rowIndex;
              matchedCellIndex = cellIndex;
            }
          });
        });

        if (matchedRowIndex >= 0 && matchedCellIndex >= 0) {
          context = {
            tableNode: node,
            tablePos: pos,
            rowIndex: matchedRowIndex,
            cellIndex: matchedCellIndex,
          };
          return false;
        }

        return true;
      });

      return context;
    }

    function getFallbackTableContext(): TableContext | null {
      if (!editor) return null;

      const localEditor = editor;
      const { selection } = localEditor.state;
      const positionsToTry = [
        selection.from,
        selection.to,
        lastTableCellSelectionRef.current,
        getActiveTableSelectionPosition(),
        getFirstTextPositionInsideTable(),
        getLastTableSelectionPosition(),
      ];

      for (const position of positionsToTry) {
        const context = getContextFromPosition(position);
        if (context) return context;
      }

      let firstContext: TableContext | null = null;

      localEditor.state.doc.descendants((node, pos) => {
        if (firstContext) return false;
        if (node.type.name !== 'table') return true;

        const firstRow = node.childCount > 0 ? node.child(0) : null;
        if (!firstRow || firstRow.type.name !== 'tableRow' || firstRow.childCount === 0) {
          return true;
        }

        firstContext = {
          tableNode: node,
          tablePos: pos,
          rowIndex: 0,
          cellIndex: 0,
        };

        return false;
      });

      return firstContext;
    }

    function makeBlankCell(cellJson: any) {
      const attrs = {
        ...(cellJson?.attrs || {}),
        colspan: 1,
        rowspan: 1,
        colwidth: null,
      };

      return {
        type: cellJson?.type || 'tableCell',
        attrs,
        content: [{ type: 'paragraph' }],
      };
    }

    function findTextPositionInTableCell(tableNode: any, tablePos: number, rowIndex: number, cellIndex: number) {
      let textPosition: number | null = null;
      let currentRowIndex = 0;

      tableNode.forEach((rowNode: any, rowOffset: number) => {
        if (textPosition !== null) return;
        if (currentRowIndex !== rowIndex) {
          currentRowIndex += 1;
          return;
        }

        let currentCellIndex = 0;
        rowNode.forEach((cellNode: any, cellOffset: number) => {
          if (textPosition !== null) return;
          if (currentCellIndex !== cellIndex) {
            currentCellIndex += 1;
            return;
          }

          const cellPos = tablePos + 1 + rowOffset + 1 + cellOffset;

          cellNode.descendants((childNode: any, relativePos: number) => {
            if (textPosition !== null) return false;

            if (childNode.isTextblock) {
              textPosition = cellPos + relativePos + 1;
              return false;
            }

            return true;
          });

          if (textPosition === null) textPosition = cellPos + 1;
        });
      });

      return textPosition;
    }

    const context = getFallbackTableContext();

    if (!context) return false;

    const tableJson = context.tableNode.toJSON();
    const rows = Array.isArray(tableJson.content) ? [...tableJson.content] : [];

    if (!rows.length) return false;

    const safeRowIndex = Math.min(Math.max(context.rowIndex, 0), rows.length - 1);
    const targetRow = rows[safeRowIndex];
    const targetRowCells = Array.isArray(targetRow.content) ? [...targetRow.content] : [];

    if (!targetRowCells.length) return false;

    const safeCellIndex = Math.min(Math.max(context.cellIndex, 0), targetRowCells.length - 1);
    let nextRowIndex = safeRowIndex;
    let nextCellIndex = safeCellIndex;
    let changed = false;

    if (commandName === 'addRowBefore' || commandName === 'addRowAfter') {
      const newRow = {
        type: 'tableRow',
        attrs: targetRow.attrs || undefined,
        content: targetRowCells.map((cellJson: any) => makeBlankCell(cellJson)),
      };

      const insertIndex = commandName === 'addRowBefore' ? safeRowIndex : safeRowIndex + 1;
      rows.splice(insertIndex, 0, newRow);
      nextRowIndex = insertIndex;
      nextCellIndex = Math.min(safeCellIndex, newRow.content.length - 1);
      changed = true;
    }

    if (commandName === 'addColumnBefore' || commandName === 'addColumnAfter') {
      rows.forEach((rowJson: any, rowIndex: number) => {
        const cells = Array.isArray(rowJson.content) ? [...rowJson.content] : [];
        if (!cells.length) return;

        const referenceIndex = Math.min(safeCellIndex, cells.length - 1);
        const referenceCell = cells[referenceIndex];
        const insertIndex = commandName === 'addColumnBefore' ? referenceIndex : referenceIndex + 1;

        cells.splice(insertIndex, 0, makeBlankCell(referenceCell));
        rows[rowIndex] = {
          ...rowJson,
          content: cells,
        };
      });

      nextCellIndex = commandName === 'addColumnBefore' ? safeCellIndex : safeCellIndex + 1;
      changed = true;
    }

    if (commandName === 'splitCell') {
      const targetCell = targetRowCells[safeCellIndex];
      const attrs = targetCell?.attrs || {};
      const colSpan = Math.max(1, Number(attrs.colspan || attrs.colSpan || 1));
      const rowSpan = Math.max(1, Number(attrs.rowspan || attrs.rowSpan || 1));

      if (colSpan === 1 && rowSpan === 1) return false;

      const normalizedTargetCell = {
        ...targetCell,
        attrs: {
          ...attrs,
          colspan: 1,
          rowspan: 1,
          colwidth: null,
        },
      };

      targetRowCells[safeCellIndex] = normalizedTargetCell;

      for (let colIndex = 1; colIndex < colSpan; colIndex += 1) {
        targetRowCells.splice(safeCellIndex + colIndex, 0, makeBlankCell(targetCell));
      }

      rows[safeRowIndex] = {
        ...targetRow,
        content: targetRowCells,
      };

      for (let rowOffset = 1; rowOffset < rowSpan; rowOffset += 1) {
        const rowToPatchIndex = safeRowIndex + rowOffset;
        const rowToPatch = rows[rowToPatchIndex];

        if (!rowToPatch) continue;

        const rowToPatchCells = Array.isArray(rowToPatch.content)
          ? [...rowToPatch.content]
          : [];

        for (let colIndex = 0; colIndex < colSpan; colIndex += 1) {
          rowToPatchCells.splice(safeCellIndex + colIndex, 0, makeBlankCell(targetCell));
        }

        rows[rowToPatchIndex] = {
          ...rowToPatch,
          content: rowToPatchCells,
        };
      }

      changed = true;
    }

    if (!changed) return false;

    const nextTableJson = {
      ...tableJson,
      content: rows,
    };

    try {
      const nextTableNode = safeEditor.schema.nodeFromJSON(nextTableJson);
      const transaction = safeEditor.state.tr.replaceWith(
        context.tablePos,
        context.tablePos + context.tableNode.nodeSize,
        nextTableNode
      );

      safeEditor.view.dispatch(transaction);
      safeEditor.view.focus();

      const nextTextPosition = findTextPositionInTableCell(
        nextTableNode,
        context.tablePos,
        nextRowIndex,
        nextCellIndex
      );

      if (nextTextPosition !== null) {
        setTableSelectionPosition(nextTextPosition);
        lastTableCellSelectionRef.current = nextTextPosition;
      }

      window.setTimeout(() => {
        rememberDomTableCell();
        notifyEditorChange();
      }, 0);

      return true;
    } catch {
      return false;
    }
  }

  function runTableCommand(commandName: string) {
    if (!editor || !editorHasTable(editor)) return;

    const commandEditor = editor;

    rememberDomTableCell();

    const commandMap: Record<string, () => boolean> = {
      addColumnBefore: () => Boolean((commandEditor.chain().focus() as any).addColumnBefore().run()),
      addColumnAfter: () => Boolean((commandEditor.chain().focus() as any).addColumnAfter().run()),
      deleteColumn: () => Boolean((commandEditor.chain().focus() as any).deleteColumn().run()),
      addRowBefore: () => Boolean((commandEditor.chain().focus() as any).addRowBefore().run()),
      addRowAfter: () => Boolean((commandEditor.chain().focus() as any).addRowAfter().run()),
      deleteRow: () => Boolean((commandEditor.chain().focus() as any).deleteRow().run()),
      deleteTable: () => Boolean((commandEditor.chain().focus() as any).deleteTable().run()),
      mergeCells: () => Boolean((commandEditor.chain().focus() as any).mergeCells().run()),
      splitCell: () => Boolean((commandEditor.chain().focus() as any).splitCell().run()),
      toggleHeaderRow: () => Boolean((commandEditor.chain().focus() as any).toggleHeaderRow().run()),
      toggleHeaderColumn: () => Boolean((commandEditor.chain().focus() as any).toggleHeaderColumn().run()),
      toggleHeaderCell: () => Boolean((commandEditor.chain().focus() as any).toggleHeaderCell().run()),
    };

    const directCommand = commandMap[commandName];

    if (!directCommand) return;

    const activeTablePosition = getActiveTableSelectionPosition();

    if (activeTablePosition !== null) {
      lastTableCellSelectionRef.current = activeTablePosition;
    }

    const fallbackFirstCommands = new Set([
      'addColumnBefore',
      'addColumnAfter',
      'addRowBefore',
      'addRowAfter',
      'splitCell',
    ]);

    if (fallbackFirstCommands.has(commandName)) {
      const fallbackDidRun = runProseMirrorTableCommandFallback(commandName);

      if (fallbackDidRun) return;
    }

    const selectionReady = ensureSelectionInsideTable();

    let didRun = false;

    if (selectionReady) {
      try {
        didRun = directCommand();
      } catch {
        didRun = false;
      }
    }

    if (!didRun) {
      try {
        focusLastTableCell();

        const command = (commandEditor.commands as any)[commandName];

        if (typeof command === 'function') {
          didRun = Boolean(command());
        }
      } catch {
        didRun = false;
      }
    }

    if (!didRun) {
      try {
        const fallbackPosition =
          getFirstTextPositionInsideTable() ?? getLastTableSelectionPosition();

        if (setTableSelectionPosition(fallbackPosition)) {
          const command = (commandEditor.commands as any)[commandName];

          if (typeof command === 'function') {
            didRun = Boolean(command());
          } else {
            didRun = directCommand();
          }
        }
      } catch {
        didRun = false;
      }
    }

    if (!didRun && fallbackFirstCommands.has(commandName)) {
      didRun = runProseMirrorTableCommandFallback(commandName);
    }

    window.setTimeout(() => {
      const nextTablePosition = getActiveTableSelectionPosition();

      if (nextTablePosition !== null) {
        lastTableCellSelectionRef.current = nextTablePosition;
      }

      rememberDomTableCell();

      if (didRun) {
        notifyEditorChange();
      }
    }, 0);
  }

  function insertCustomTable(
    rows = insertTableRows,
    cols = insertTableCols
  ) {
    if (!editor) return;

    const tableContent = createEditableTableContent(rows, cols);

    editor.chain().focus().insertContent(tableContent).run();

    window.setTimeout(() => {
      const firstTableTextPosition = getFirstTextPositionInsideTable();

      if (firstTableTextPosition !== null) {
        setTableSelectionPosition(firstTableTextPosition);
      } else {
        focusLastTableCell();
      }

      notifyEditorChange();
    }, 0);
  }

  function normalizeImageUrl(url: string) {
    let trimmedUrl = url.trim();

    trimmedUrl = trimmedUrl.replace(/^['"]+|['"]+$/g, '').trim();

    try {
      const parsedUrl = new URL(trimmedUrl);

      const googleImageUrl = parsedUrl.searchParams.get('imgurl');
      if (googleImageUrl) return decodeURIComponent(googleImageUrl).trim();

      const mediaUrl = parsedUrl.searchParams.get('mediaurl');
      if (mediaUrl) return decodeURIComponent(mediaUrl).trim();

      if (/drive\.google\.com$/i.test(parsedUrl.hostname)) {
        const fileIdFromPath = parsedUrl.pathname.match(/\/file\/d\/([^/]+)/i)?.[1];
        const fileIdFromQuery = parsedUrl.searchParams.get('id');
        const driveFileId = fileIdFromPath || fileIdFromQuery;

        if (driveFileId) {
          return `https://drive.google.com/uc?export=view&id=${driveFileId}`;
        }
      }

      if (/dropbox\.com$/i.test(parsedUrl.hostname)) {
        parsedUrl.searchParams.set('raw', '1');
        parsedUrl.searchParams.delete('dl');
        return parsedUrl.toString();
      }
    } catch {
      /* Keep the original value and normalize protocol below. */
    }

    if (/^(https?:|data:image\/|blob:)/i.test(trimmedUrl)) {
      return trimmedUrl;
    }

    return `https://${trimmedUrl}`;
  }

  function readImageNaturalSizeFromUrl(imageUrl: string) {
    return new Promise<{ width: number; height: number } | null>((resolve) => {
      if (typeof window === 'undefined') {
        resolve(null);
        return;
      }

      const imageElement = new window.Image();
      let isResolved = false;

      const resolveOnce = (value: { width: number; height: number } | null) => {
        if (isResolved) return;

        isResolved = true;
        window.clearTimeout(timeoutId);
        imageElement.onload = null;
        imageElement.onerror = null;
        imageElement.src = '';
        resolve(value);
      };

      const timeoutId = window.setTimeout(() => {
        resolveOnce(null);
      }, 10000);

      imageElement.decoding = 'async';
      imageElement.referrerPolicy = 'no-referrer';

      imageElement.onload = () => {
        const naturalWidth = imageElement.naturalWidth || imageElement.width;
        const naturalHeight = imageElement.naturalHeight || imageElement.height;

        if (naturalWidth > 0 && naturalHeight > 0) {
          resolveOnce({
            width: naturalWidth,
            height: naturalHeight,
          });
          return;
        }

        resolveOnce(null);
      };

      imageElement.onerror = () => {
        resolveOnce(null);
      };

      imageElement.src = imageUrl;
    });
  }

  async function insertImageFromUrl() {
    if (!editor) return;

    const rawUrl = window.prompt(
      'Paste a direct public image URL (.jpg, .jpeg, .png, .webp, .gif, .svg):',
      'https://'
    );

    if (!rawUrl?.trim() || rawUrl.trim() === 'https://') return;

    const imageUrl = normalizeImageUrl(rawUrl);
    const naturalSize = await readImageNaturalSizeFromUrl(imageUrl);

    if (!naturalSize) {
      window.alert(
        'This image URL could not be loaded. Please paste a direct public image file URL, not a webpage, Google search result, private file, or blocked image link.'
      );
      return;
    }

    const altText = window.prompt('Alt text:', 'Inserted image') || 'Inserted image';
    const safeAltText = altText.trim() || 'Inserted image';

    (editor.chain().focus() as any)
      .setImage({
        src: imageUrl,
        alt: safeAltText,
        title: safeAltText,
        width: '60%',
        imageAlign: 'left',
        imageX: '0',
        imageY: '0',
        cropTop: '0',
        cropRight: '0',
        cropBottom: '0',
        cropLeft: '0',
        imageNaturalWidth: String(naturalSize.width),
        imageNaturalHeight: String(naturalSize.height),
      })
      .run();

    notifyEditorChange();
  }

  function focusEditorAfterSelectedImage(afterImagePosition: number) {
    if (!editor) return;

    window.setTimeout(() => {
      try {
        const safeAfterImagePosition = Math.min(
          afterImagePosition,
          editor.state.doc.content.size
        );
        const resolvedAfterImage = editor.state.doc.resolve(safeAfterImagePosition);
        const nextNode = resolvedAfterImage.nodeAfter;

        if (!nextNode || !nextNode.isTextblock) {
          editor.commands.insertContentAt(safeAfterImagePosition, {
            type: 'paragraph',
          });
        }

        const cursorPosition = Math.min(
          safeAfterImagePosition + 1,
          editor.state.doc.content.size
        );

        editor.chain().focus().setTextSelection(cursorPosition).run();
      } catch {
        editor.commands.focus();
      }
    }, 0);
  }

  function updateSelectedImageAttributes(
    attributes: Record<string, string | null>,
    options?: { focusAfterImage?: boolean }
  ) {
    if (!editor) return;

    if (!editor.isActive('image')) {
      window.alert('Select an inserted image first, then use the picture tools.');
      return;
    }

    const afterImagePosition = editor.state.selection.to;

    (editor.chain().focus() as any)
      .updateAttributes('image', attributes)
      .run();

    if (options?.focusAfterImage) {
      focusEditorAfterSelectedImage(afterImagePosition);
    }

    notifyEditorChange();
  }

  function applySelectedImageWidth(width: string) {
    updateSelectedImageAttributes({
      width,
    });
  }

  function applySelectedImageAlignment(
    imageAlign: 'inline' | 'left' | 'center' | 'right' | 'float-left' | 'float-right'
  ) {
    updateSelectedImageAttributes(
      {
        imageAlign,
      },
      {
        focusAfterImage: true,
      }
    );
  }

  function resetSelectedImageFormat() {
    updateSelectedImageAttributes({
      width: '60%',
      imageAlign: 'center',
      imageX: '0',
      imageY: '0',
      cropTop: '0',
      cropRight: '0',
      cropBottom: '0',
      cropLeft: '0',
    });
  }

  function updateSelectedImageAltText() {
    const altText = window.prompt('Alt text for selected image:');
    if (altText === null) return;

    updateSelectedImageAttributes({
      alt: altText.trim(),
      title: altText.trim(),
    });
  }


  function enableSelectedImageFreePosition() {
    updateSelectedImageAttributes({
      imageAlign: 'free',
      imageX: '24',
      imageY: '24',
    });
  }

  function resetSelectedImageCrop() {
    updateSelectedImageAttributes({
      cropTop: '0',
      cropRight: '0',
      cropBottom: '0',
      cropLeft: '0',
    });
  }

  function deleteSelectedImage() {
    if (!editor) return;

    if (!editor.isActive('image')) {
      window.alert('Select an inserted image first, then use the picture tools.');
      return;
    }

    editor.chain().focus().deleteSelection().run();
    notifyEditorChange();
  }

  function insertTextBox() {
    if (!editor) return;

    editor.commands.focus();
  }

  function insertQuickPart(quickPartType: string) {
    if (!quickPartType) return;

    const quickPartFieldStyle =
      'margin: 10px 0; color: #334155; font-size: 13px; font-weight: 700; line-height: 20px; overflow-wrap: anywhere; word-break: break-word';
    const noteTitleStyle =
      'margin: 14px 0 0; padding: 12px 14px 4px; border-left: 4px solid #10ab7c; border-radius: 12px 12px 0 0; background: #eefaf6; color: #0f766e; font-size: 13px; font-weight: 850; line-height: 20px';
    const noteBodyStyle =
      'margin: 0 0 14px; padding: 0 14px 12px; border-left: 4px solid #10ab7c; border-radius: 0 0 12px 12px; background: #eefaf6; color: #334155; font-size: 13px; font-weight: 600; line-height: 20px; overflow-wrap: anywhere; word-break: break-word';
    const instructionTitleStyle =
      'margin: 14px 0 0; padding: 12px 14px 4px; border-left: 4px solid #1d4ed8; border-radius: 12px 12px 0 0; background: #eff6ff; color: #1d4ed8; font-size: 13px; font-weight: 850; line-height: 20px';
    const instructionBodyStyle =
      'margin: 0 0 14px; padding: 0 14px 12px; border-left: 4px solid #1d4ed8; border-radius: 0 0 12px 12px; background: #eff6ff; color: #334155; font-size: 13px; font-weight: 600; line-height: 20px; overflow-wrap: anywhere; word-break: break-word';

    const courseName = aiContext?.courseTitle?.trim() || '[Course Name]';
    const courseCode = aiContext?.courseCode?.trim() || '[Course Code]';

    if (quickPartType === 'currentDate') {
      insertDocumentContent(
        createDocumentUtilityParagraph(
          'quick-part-current-date',
          `Date: ${getTodayLabel()}`,
          quickPartFieldStyle
        )
      );
      return;
    }

    if (quickPartType === 'documentTitle') {
      insertDocumentContent(
        createDocumentUtilityParagraph(
          'quick-part-document-title',
          'Document Title: [Document Title]',
          quickPartFieldStyle
        )
      );
      return;
    }

    if (quickPartType === 'institutionName') {
      insertDocumentContent(
        createDocumentUtilityParagraph(
          'quick-part-institution-name',
          'Institution Name: [Institution Name]',
          quickPartFieldStyle
        )
      );
      return;
    }

    if (quickPartType === 'courseName') {
      insertDocumentContent(
        createDocumentUtilityParagraph(
          'quick-part-course-name',
          `Course Name: ${courseName}`,
          quickPartFieldStyle
        )
      );
      return;
    }

    if (quickPartType === 'courseCode') {
      insertDocumentContent(
        createDocumentUtilityParagraph(
          'quick-part-course-code',
          `Course Code: ${courseCode}`,
          quickPartFieldStyle
        )
      );
      return;
    }

    if (quickPartType === 'noteBlock') {
      insertDocumentContent([
        createDocumentUtilityParagraph('quick-part-note-title', 'Note', noteTitleStyle),
        createDocumentUtilityParagraph(
          'quick-part-note-body',
          'Write your note here.',
          noteBodyStyle
        ),
      ]);
      return;
    }

    if (quickPartType === 'instructionBlock') {
      insertDocumentContent([
        createDocumentUtilityParagraph(
          'quick-part-instruction-title',
          'Instruction',
          instructionTitleStyle
        ),
        createDocumentUtilityParagraph(
          'quick-part-instruction-body',
          'Write the instruction here.',
          instructionBodyStyle
        ),
      ]);
    }
  }

  function getCoverPageTemplateContent(templateType: CoverPageTemplateType) {
    const currentDate = getTodayLabel();

    const templates: Record<CoverPageTemplateType, {
      institution: string;
      title: string;
      subtitle: string;
      metaLines: string[];
      accent: string;
    }> = {
      academicReport: {
        institution: 'INSTITUTION / UNIVERSITY NAME',
        title: 'Academic Report Title',
        subtitle: 'Course / Subject / Department',
        metaLines: [
          'Prepared by: Student / Author Name',
          'Register No.: [Enter register number]',
          'Submitted to: Faculty / Department Name',
          `Date: ${currentDate}`,
        ],
        accent: '#1d4ed8',
      },
      courseAssignment: {
        institution: 'COURSE ASSIGNMENT',
        title: 'Assignment Title',
        subtitle: 'Course Code and Course Name',
        metaLines: [
          'Learner name: [Enter name]',
          'Instructor: [Enter instructor name]',
          'Batch / Semester: [Enter details]',
          `Submission date: ${currentDate}`,
        ],
        accent: '#0f766e',
      },
      projectReport: {
        institution: 'PROJECT REPORT',
        title: 'Project Title',
        subtitle: 'Department / Programme / Organization',
        metaLines: [
          'Submitted by: [Team / learner name]',
          'Project guide: [Guide name]',
          'Academic year: [Enter year]',
          `Date: ${currentDate}`,
        ],
        accent: '#7c3aed',
      },
      trainingModule: {
        institution: 'TRAINING MODULE',
        title: 'Module Title',
        subtitle: 'Learning Path / Programme Name',
        metaLines: [
          'Target audience: [Enter audience]',
          'Prepared by: [Trainer / content owner]',
          'Version: 1.0',
          `Date: ${currentDate}`,
        ],
        accent: '#b45309',
      },
      minimalDocument: {
        institution: 'DOCUMENT',
        title: 'Document Title',
        subtitle: 'Subtitle / Description',
        metaLines: [`Date: ${currentDate}`, 'Author: [Enter author name]'],
        accent: '#334155',
      },
    };

    return templates[templateType];
  }

  function buildCoverPageContent(templateType: CoverPageTemplateType) {
    const template = getCoverPageTemplateContent(templateType);

    return [
      createDocumentUtilityParagraph(
        'cover-page',
        template.institution,
        `margin: 96px 0 32px; text-align: center; color: ${template.accent}; font-size: 15px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase`
      ),
      createDocumentUtilityHeading(
        1,
        'cover-page',
        template.title,
        'margin: 0 0 18px; text-align: center; color: #111827; font-size: 36px; line-height: 44px; font-weight: 850'
      ),
      createDocumentUtilityParagraph(
        'cover-page',
        template.subtitle,
        'margin: 0 0 72px; text-align: center; color: #334155; font-size: 18px; font-weight: 650'
      ),
      ...template.metaLines.map((line, index) =>
        createDocumentUtilityParagraph(
          'cover-page',
          line,
          `margin: ${index === 0 ? '0' : '8px'} 0 0; text-align: center; color: #334155; font-size: 14px; font-weight: 600`
        )
      ),
      createDocumentUtilityParagraph(
        'cover-page',
        '',
        `margin: 76px auto 0; width: 160px; height: 4px; border-radius: 999px; background: ${template.accent}`
      ),
      createPageBreakParagraph(),
      createPageStartMarkerParagraph(
        'cover-page-body-start',
        createSmallEditorMarkerText('Cover page ended — continue writing on the next page'),
        template.accent
      ),
      createEditableEmptyParagraph(),
    ];
  }

  function handleCoverPageTemplateSelect(value: string) {
    if (!value) return;
    insertCoverPage(value as CoverPageTemplateType);
  }

  function insertCoverPage(templateType: CoverPageTemplateType = 'academicReport') {
    insertDocumentContent(buildCoverPageContent(templateType));
  }

  function insertBlankPage() {
    const blankPageNumber = getNextDocumentUtilityNumber('blank-page');

    insertDocumentContent([
      createPageBreakParagraph(
        createSmallEditorMarkerText(`Blank page (page ${blankPageNumber}) started`),
        '#0f766e'
      ),
      createBlankPageMarkerParagraph(),
      createPageBreakParagraph(
        createSmallEditorMarkerText(`Blank page ended (page ${blankPageNumber})`),
        '#1d4ed8'
      ),
      createEditableEmptyParagraph(),
    ]);
  }

  function getHeaderTemplateContent(templateType: HeaderTemplateType) {
    const currentDate = getTodayLabel();
    const baseStyle =
      'margin: 0 0 18px; padding: 0 0 11px; border-bottom: 1px solid #cbd5e1; color: #334155; font-size: 12px; font-weight: 700; line-height: 18px; text-align: center; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word';

    const templates: Record<HeaderTemplateType, { text: string; style: string }> = {
      documentTitle: {
        text: `Document Title    |    Organization Name    |    ${currentDate}`,
        style: `${baseStyle}; text-align: left; border-bottom: 2px solid #1d4ed8; color: #1e293b; letter-spacing: 0.01em`,
      },
      courseUnit: {
        text: `Course Code / Course Title    |    Unit / Module Name    |    Term / Semester`,
        style: `${baseStyle}; text-align: left; border-bottom: 2px solid #0f766e; color: #0f172a`,
      },
      confidential: {
        text: `CONFIDENTIAL    |    Internal Use Only    |    ${currentDate}`,
        style: `${baseStyle}; color: #991b1b; border-bottom: 2px solid #ef4444; text-transform: uppercase; letter-spacing: 0.08em`,
      },
      draftReview: {
        text: `DRAFT FOR REVIEW    |    Version 1.0    |    Review Date: ${currentDate}`,
        style: `${baseStyle}; color: #6d28d9; border-bottom: 2px solid #8b5cf6; letter-spacing: 0.03em`,
      },
      minimal: {
        text: `Document Header    |    ${currentDate}`,
        style: `${baseStyle}; font-weight: 650; color: #475569`,
      },
    };

    return templates[templateType];
  }

  function getFooterTemplateContent(templateType: FooterTemplateType) {
    const currentDate = getTodayLabel();
    const baseStyle =
      'margin: 24px 0 0; padding: 12px 0 0; border-top: 2px solid #cbd5e1; color: #475569; font-size: 12px; font-weight: 700; line-height: 18px; text-align: center; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word';

    const templates: Record<FooterTemplateType, { text: string; style: string }> = {
      pageFooter: {
        text: `Document Title    |    Organization Name    |    ${currentDate}    |    Page [#]`,
        style: `${baseStyle}; color: #1e293b; border-top-color: #1d4ed8; letter-spacing: 0.01em`,
      },
      preparedBy: {
        text: `Prepared by: [Name]    |    Reviewed by: [Name]    |    Approved by: [Name]    |    ${currentDate}`,
        style: `${baseStyle}; color: #0f172a; border-top-color: #0f766e`,
      },
      confidentialFooter: {
        text: `CONFIDENTIAL    |    Internal Use Only    |    Do Not Distribute    |    ${currentDate}`,
        style: `${baseStyle}; color: #991b1b; border-top-color: #ef4444; text-transform: uppercase; letter-spacing: 0.08em`,
      },
      approvalFooter: {
        text: `Approval Status: Approved    |    Authorized Signatory: [Name]    |    Effective Date: ${currentDate}`,
        style: `${baseStyle}; color: #0f766e; border-top-color: #10b981; letter-spacing: 0.02em`,
      },
      minimalFooter: {
        text: `Document Footer    |    ${currentDate}`,
        style: `${baseStyle}; font-weight: 650; color: #475569; border-top-color: #94a3b8`,
      },
    };

    return templates[templateType];
  }

  function applyHeaderTemplate(templateType: HeaderTemplateType) {
    if (!editor) return;

    const template = getHeaderTemplateContent(templateType);
    const headerNode = editor.schema.nodeFromJSON(
      createDocumentUtilityParagraph(
        'document-header',
        template.text,
        template.style
      )
    );
    const ranges: { from: number; to: number }[] = [];

    editor.state.doc.descendants((node, position) => {
      if (node.attrs?.documentUtilityType === 'document-header') {
        ranges.push({
          from: position,
          to: position + node.nodeSize,
        });
      }

      return true;
    });

    let transaction = editor.state.tr;

    [...ranges]
      .sort((firstRange, secondRange) => secondRange.from - firstRange.from)
      .forEach((range) => {
        transaction = transaction.delete(range.from, range.to);
      });

    transaction = transaction.insert(0, headerNode);
    editor.view.dispatch(transaction.scrollIntoView());
    notifyEditorChange();
  }

  function removeDocumentUtilityNodes(documentUtilityType: string) {
    if (!editor) return false;

    const ranges: { from: number; to: number }[] = [];

    editor.state.doc.descendants((node, position) => {
      if (node.attrs?.documentUtilityType === documentUtilityType) {
        ranges.push({
          from: position,
          to: position + node.nodeSize,
        });
      }

      return true;
    });

    if (ranges.length === 0) return false;

    const transaction = editor.state.tr;

    [...ranges]
      .sort((firstRange, secondRange) => secondRange.from - firstRange.from)
      .forEach((range) => {
        transaction.delete(range.from, range.to);
      });

    editor.view.dispatch(transaction);
    return true;
  }

  function applyFooterTemplate(templateType: FooterTemplateType) {
    if (!editor) return;

    const template = getFooterTemplateContent(templateType);
    const footerNode = editor.schema.nodeFromJSON(
      createDocumentUtilityParagraph(
        'document-footer',
        template.text,
        template.style
      )
    );
    const ranges: { from: number; to: number }[] = [];

    editor.state.doc.descendants((node, position) => {
      if (node.attrs?.documentUtilityType === 'document-footer') {
        ranges.push({
          from: position,
          to: position + node.nodeSize,
        });
      }

      return true;
    });

    let transaction = editor.state.tr;

    [...ranges]
      .sort((firstRange, secondRange) => secondRange.from - firstRange.from)
      .forEach((range) => {
        transaction = transaction.delete(range.from, range.to);
      });

    transaction = transaction.insert(transaction.doc.content.size, footerNode);
    editor.view.dispatch(transaction.scrollIntoView());
    notifyEditorChange();
  }

  function handleHeaderTemplateSelect(value: string) {
    if (!value) return;
    applyHeaderTemplate(value as HeaderTemplateType);
  }

  function handleFooterTemplateSelect(value: string) {
    if (!value) return;
    applyFooterTemplate(value as FooterTemplateType);
  }

  function insertHeaderBlock() {
    applyHeaderTemplate('documentTitle');
  }

  function insertFooterBlock() {
    applyFooterTemplate('pageFooter');
  }

  function insertPageNumberBlock() {
    insertDocumentContent(
      createDocumentUtilityParagraph(
        'page-number',
        '',
        'display: none; height: 0; margin: 0; padding: 0; overflow: hidden'
      )
    );
  }

  function insertSeparatorLine() {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'horizontalRule',
        attrs: {
          documentUtilityType: 'separator',
          documentUtilityStyle:
            'border: 0; border-top: 1px solid #cbd5e1; margin: 22px 0; height: 0',
        },
      })
      .run();

    notifyEditorChange();
  }

  function getSmartArtTemplateRows(type: SmartArtTemplateType) {
    const templates: Record<
      SmartArtTemplateType,
      {
        title: string;
        usage: string;
        rows: string[][];
      }
    > = {
      basicBlockList: {
        title: 'Basic Block List',
        usage: 'Use this for non-sequential or grouped information blocks. Edit the table below and press Enter to refresh the SmartArt preview.',
        rows: [
          ['Block 1', 'Block 2', 'Block 3'],
          ['Main idea', 'Supporting idea', 'Result / action'],
          ['Edit this text', 'Edit this text', 'Edit this text'],
        ],
      },
      verticalBulletList: {
        title: 'Vertical Bullet List',
        usage: 'Use this for lists, requirements, module notes, or summarized sections. Edit the table below and press Enter to refresh the preview.',
        rows: [
          ['Item', 'Description'],
          ['Point 1', 'Editable supporting explanation'],
          ['Point 2', 'Editable supporting explanation'],
          ['Point 3', 'Editable supporting explanation'],
        ],
      },
      pictureList: {
        title: 'Picture List',
        usage: 'Use this for image-based learning, screenshots, product examples, or visual lesson objects. Edit the table below and press Enter to refresh the preview.',
        rows: [
          ['Picture', 'Title', 'Description'],
          ['Image 1', 'Visual Example 1', 'Edit this description'],
          ['Image 2', 'Visual Example 2', 'Edit this description'],
          ['Image 3', 'Visual Example 3', 'Edit this description'],
        ],
      },
      process: {
        title: 'Basic Process',
        usage: 'Use this for workflows, learning sequences, approval stages, and task flows. Edit the table below and press Enter to refresh the preview.',
        rows: [
          ['Step 1', 'Step 2', 'Step 3', 'Step 4'],
          ['Plan', 'Design', 'Develop', 'Review'],
          ['Define goal', 'Prepare assets', 'Create output', 'Approve changes'],
        ],
      },
      chevronProcess: {
        title: 'Chevron Process',
        usage: 'Use this for directional stages from beginning to end. Edit the table below and press Enter to refresh the preview.',
        rows: [
          ['Start', 'Prepare', 'Execute', 'Complete'],
          ['Input', 'Activity', 'Review', 'Output'],
          ['Define request', 'Build the work', 'Validate quality', 'Publish / submit'],
        ],
      },
      cycle: {
        title: 'Basic Cycle',
        usage: 'Use this for continuous improvement, feedback loops, project cycles, or learning cycles. Edit the table below and press Enter to refresh the preview.',
        rows: [
          ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4'],
          ['Plan', 'Create', 'Check', 'Improve'],
          ['Set objective', 'Build content', 'Review quality', 'Revise and repeat'],
        ],
      },
      hierarchy: {
        title: 'Organization Chart',
        usage: 'Use this for organization charts, module structures, topic maps, or reporting hierarchies. Edit the table below and press Enter to refresh the preview.',
        rows: [
          ['Main Topic / Department / Course'],
          ['Subtopic A', 'Subtopic B', 'Subtopic C'],
          ['Detail A1', 'Detail B1', 'Detail C1'],
        ],
      },
      relationship: {
        title: 'Relationship Diagram',
        usage: 'Use this for relationships between concepts, stakeholders, processes, or learning outcomes. Edit the table below and press Enter to refresh the preview.',
        rows: [
          ['Concept A', 'Connection', 'Concept B'],
          ['Input', 'supports / influences', 'Outcome'],
          ['Stakeholder', 'collaborates with', 'Team'],
        ],
      },
      matrix: {
        title: 'Matrix',
        usage: 'Use this for comparison, decision matrices, SWOT-like analysis, or curriculum mapping. Edit the table below and press Enter to refresh the preview.',
        rows: [
          ['', 'Area 1', 'Area 2'],
          ['Factor A', 'Input / strength', 'Risk / gap'],
          ['Factor B', 'Evidence / example', 'Action / owner'],
        ],
      },
      pyramid: {
        title: 'Basic Pyramid',
        usage: 'Use this for priority levels, Bloom levels, foundations, or staged skill development. Edit the table below and press Enter to refresh the preview.',
        rows: [
          ['Level', 'Meaning'],
          ['Top', 'Final outcome / highest priority'],
          ['Middle', 'Supporting competencies or requirements'],
          ['Base', 'Foundation concepts, resources, or prerequisites'],
        ],
      },
      pictureCaptionList: {
        title: 'Picture Caption List',
        usage: 'Use this for screenshots, learner examples, portfolio items, or visual documentation. Edit the table below and press Enter to refresh the preview.',
        rows: [
          ['Visual', 'Caption'],
          ['Picture 1', 'Caption 1: edit this text'],
          ['Picture 2', 'Caption 2: edit this text'],
          ['Picture 3', 'Caption 3: edit this text'],
        ],
      },
    };

    return templates[type];
  }

  function insertSmartArtTemplate(type = selectedSmartArtTemplate) {
    const template = getSmartArtTemplateRows(type);
    const previewHtml = buildSmartArtPreviewHtml(type, template.rows);
    const tableHtml = buildEditableDataTableHtml(
      template.rows,
      `data-smartart-data-table="true" data-smartart-table-type="${type}"`,
      'Edit SmartArt data. Changes refresh the SmartArt preview automatically.'
    );

    insertHtml(`
      <h3>SmartArt: ${escapeHtml(template.title)}</h3>
      ${previewHtml}
      <p><strong>SmartArt data</strong></p>
      ${tableHtml}
      <p>Edit the table cells to update the SmartArt preview.</p>
      <p><strong>Usage:</strong> ${escapeHtml(template.usage)}</p>
    `);

    window.setTimeout(() => refreshInsertObjectVisuals(false), 0);
  }

  function getEditableChartTemplateRows(type: EditableChartType) {
    const templates: Record<
      EditableChartType,
      {
        title: string;
        usage: string;
        rows: string[][];
      }
    > = {
      column: {
        title: 'Clustered Column',
        usage: 'Use this to compare multiple series across categories. Edit the data table and press Enter to redraw the chart.',
        rows: [
          ['Category', 'Series A', 'Series B', 'Series C'],
          ['Category 1', '4.3', '2.4', '2.0'],
          ['Category 2', '2.5', '4.4', '2.0'],
          ['Category 3', '3.5', '1.8', '3.0'],
          ['Category 4', '4.5', '2.8', '5.0'],
        ],
      },
      stackedColumn: {
        title: 'Stacked Column',
        usage: 'Use this when each category contains multiple parts that make a total. Edit the data table and press Enter to redraw the chart.',
        rows: [
          ['Category', 'Completed', 'Pending', 'Delayed'],
          ['Team A', '30', '12', '4'],
          ['Team B', '24', '18', '6'],
          ['Team C', '38', '9', '3'],
        ],
      },
      line: {
        title: 'Line',
        usage: 'Use this for progress over time, performance trends, or completion tracking. Edit the data table and press Enter to redraw the chart.',
        rows: [
          ['Period', 'Actual', 'Target'],
          ['Week 1', '20', '25'],
          ['Week 2', '45', '45'],
          ['Week 3', '60', '65'],
          ['Week 4', '85', '80'],
        ],
      },
      pie: {
        title: 'Pie',
        usage: 'Use this to show parts of a whole. Edit values and press Enter to redraw the chart.',
        rows: [
          ['Category', 'Value (%)'],
          ['Marketing', '30'],
          ['Product Development', '25'],
          ['Operations', '20'],
          ['Customer Support', '15'],
          ['Other Expenses', '10'],
        ],
      },
      doughnut: {
        title: 'Doughnut',
        usage: 'Use this for completion status, progress share, or summary breakdowns. Edit values and press Enter to redraw the chart.',
        rows: [
          ['Segment', 'Percent'],
          ['Completed', '70'],
          ['Pending', '20'],
          ['At Risk', '10'],
        ],
      },
      bar: {
        title: 'Bar',
        usage: 'Use this when labels are long or horizontal comparison is clearer. Edit values and press Enter to redraw the chart.',
        rows: [
          ['Item', 'Value'],
          ['Skill A', '40'],
          ['Skill B', '65'],
          ['Skill C', '90'],
        ],
      },
      area: {
        title: 'Area',
        usage: 'Use this to show accumulated change or volume across time. Edit values and press Enter to redraw the chart.',
        rows: [
          ['Month', 'Series A', 'Series B'],
          ['Jan', '20', '12'],
          ['Feb', '32', '20'],
          ['Mar', '48', '28'],
          ['Apr', '60', '35'],
        ],
      },
      scatter: {
        title: 'X Y Scatter',
        usage: 'Use this for correlation, relationship analysis, or paired data. Edit X and Y values and press Enter to redraw the chart.',
        rows: [
          ['Point', 'X Value', 'Y Value'],
          ['A', '2', '30'],
          ['B', '5', '55'],
          ['C', '8', '85'],
          ['D', '10', '92'],
        ],
      },
      map: {
        title: 'Map',
        usage: 'Use this for editable location or region-based data. Edit values and press Enter to redraw the chart.',
        rows: [
          ['Location', 'Value'],
          ['North', '42'],
          ['South', '28'],
          ['West', '35'],
          ['East', '50'],
        ],
      },
      stock: {
        title: 'Stock',
        usage: 'Use this for finance-style open, high, low, and close values. Edit values and press Enter to redraw the chart.',
        rows: [
          ['Date', 'Open', 'High', 'Low', 'Close'],
          ['Day 1', '40', '48', '36', '45'],
          ['Day 2', '45', '52', '42', '47'],
          ['Day 3', '47', '55', '44', '53'],
        ],
      },
      surface: {
        title: 'Surface',
        usage: 'Use this as an editable two-variable grid or heatmap-like surface. Edit values and press Enter to redraw the chart.',
        rows: [
          ['', 'Low', 'Medium', 'High'],
          ['Group A', '12', '28', '40'],
          ['Group B', '18', '35', '52'],
          ['Group C', '24', '42', '60'],
        ],
      },
      radar: {
        title: 'Radar',
        usage: 'Use this for competency profiles, rubric ratings, or multi-skill comparison. Edit values and press Enter to redraw the chart.',
        rows: [
          ['Skill Area', 'Score'],
          ['Knowledge', '4'],
          ['Application', '3'],
          ['Communication', '5'],
          ['Analysis', '4'],
        ],
      },
      treemap: {
        title: 'Treemap',
        usage: 'Use this for grouped proportions or hierarchical contribution. Edit values and press Enter to redraw the chart.',
        rows: [
          ['Parent', 'Item', 'Value'],
          ['Course Content', 'Unit 1', '30'],
          ['Course Content', 'Unit 2', '45'],
          ['Course Content', 'Unit 3', '25'],
        ],
      },
      sunburst: {
        title: 'Sunburst',
        usage: 'Use this for editable hierarchy across levels. Edit values and press Enter to redraw the chart.',
        rows: [
          ['Level 1', 'Level 2', 'Value'],
          ['Course', 'Unit 1', '20'],
          ['Course', 'Unit 2', '35'],
          ['Course', 'Unit 3', '45'],
        ],
      },
      histogram: {
        title: 'Histogram',
        usage: 'Use this for score bands, response ranges, or frequency distribution. Edit frequencies and press Enter to redraw the chart.',
        rows: [
          ['Range', 'Frequency'],
          ['0-20', '4'],
          ['21-40', '9'],
          ['41-60', '18'],
          ['61-80', '13'],
          ['81-100', '6'],
        ],
      },
      boxWhisker: {
        title: 'Box & Whisker',
        usage: 'Use this to compare distributions, medians, and ranges. Edit values and press Enter to redraw the chart.',
        rows: [
          ['Group', 'Minimum', 'Q1', 'Median', 'Q3', 'Maximum'],
          ['Class A', '20', '35', '50', '68', '90'],
          ['Class B', '25', '42', '58', '72', '95'],
        ],
      },
      waterfall: {
        title: 'Waterfall',
        usage: 'Use this to show cumulative positive and negative changes. Edit values and press Enter to redraw the chart.',
        rows: [
          ['Stage', 'Change'],
          ['Start', '100'],
          ['Increase', '30'],
          ['Decrease', '-15'],
          ['Final', '20'],
        ],
      },
      funnel: {
        title: 'Funnel',
        usage: 'Use this for pipeline stages, review status, admission flow, or approval progress. Edit counts and press Enter to redraw the chart.',
        rows: [
          ['Stage', 'Count'],
          ['Submitted', '120'],
          ['Reviewed', '90'],
          ['Approved', '60'],
        ],
      },
      combo: {
        title: 'Combo',
        usage: 'Use this when one chart needs both quantity and target/progress percentage. Edit values and press Enter to redraw the chart.',
        rows: [
          ['Period', 'Volume', 'Target %'],
          ['Q1', '45', '60'],
          ['Q2', '70', '75'],
          ['Q3', '88', '90'],
        ],
      },
    };

    return templates[type];
  }

  function insertEditableChart(type = selectedChartTemplate) {
    const template = getEditableChartTemplateRows(type);
    const previewHtml = buildChartPreviewHtml(type, template.rows);
    const tableHtml = buildEditableDataTableHtml(
      template.rows,
      `data-chart-data-table="true" data-chart-table-type="${type}"`,
      'Edit chart data. Changes refresh the chart preview automatically.'
    );

    insertHtml(`
      <h3>Charts: ${escapeHtml(template.title)}</h3>
      ${previewHtml}
      <p><strong>Chart data</strong></p>
      ${tableHtml}
      <p>Edit the table cells to update the chart. Use numbers in the value columns.</p>
      <p><strong>Usage:</strong> ${escapeHtml(template.usage)}</p>
    `);

    window.setTimeout(() => refreshInsertObjectVisuals(false), 0);
  }

  function insertSmartArtPlaceholder() {
    setIsSmartArtChooserOpen(true);
  }

  function insertChartPlaceholder() {
    setIsChartChooserOpen(true);
  }

  function handleSmartArtTemplateSelect(value: string) {
    if (!value) return;
    insertSmartArtTemplate(value as SmartArtTemplateType);
  }

  function handleChartTemplateSelect(value: string) {
    if (!value) return;
    insertEditableChart(value as EditableChartType);
  }

  function insertScreenshotPlaceholder() {
    insertHtml(`
      <figure>
        <div style="border:1px dashed #94a3b8;padding:28px;text-align:center;border-radius:10px;">
          Screenshot placeholder
        </div>
        <figcaption>Figure: Screenshot</figcaption>
      </figure>
    `);
  }

  function triggerImageUploadClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !editor) return;

    try {
      if (onImageUpload) {
        const url = await onImageUpload(file);

        (editor.chain().focus() as any).setImage({
          src: url,
          alt: file.name,
          title: file.name,
          width: '60%',
          imageAlign: 'center',
          imageX: '0',
          imageY: '0',
          cropTop: '0',
          cropRight: '0',
          cropBottom: '0',
          cropLeft: '0',
        }).run();

        notifyEditorChange();
      } else {
        const reader = new FileReader();

        reader.onload = (e) => {
          const result = e.target?.result;

          if (typeof result === 'string') {
            (editor.chain().focus() as any).setImage({
              src: result,
              alt: file.name,
              title: file.name,
              width: '60%',
              imageAlign: 'center',
              imageX: '0',
              imageY: '0',
              cropTop: '0',
              cropRight: '0',
              cropBottom: '0',
              cropLeft: '0',
            }).run();

            notifyEditorChange();
          }
        };

        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function insertEquationSymbol(symbol: string) {
    if (!symbol) return;

    const insertValue = getEquationSymbolInsertValue(symbol);
    const textarea = equationTextareaRef.current;

    if (!textarea) {
      setEquationLatex((previousValue) => `${previousValue}${insertValue}`);
      return;
    }

    const selectionStart = textarea.selectionStart ?? equationLatex.length;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;
    const nextValue = `${equationLatex.slice(0, selectionStart)}${insertValue}${equationLatex.slice(selectionEnd)}`;
    let nextCursorPosition = selectionStart + insertValue.length;
    const emptyPlaceholderIndex = insertValue.indexOf('{}');

    if (emptyPlaceholderIndex >= 0) {
      nextCursorPosition = selectionStart + emptyPlaceholderIndex + 1;
    }

    setEquationLatex(nextValue);

    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  }

  function insertEquation() {
    setEquationDialogMode('insert');
    setEditingEquationPos(null);
    setEquationLatex('');
    setEquationDisplayMode('block');
    setIsEquationDialogOpen(true);
  }

  function closeEquationDialog() {
    setIsEquationDialogOpen(false);
    setEquationDialogMode('insert');
    setEditingEquationPos(null);
    setEquationLatex('');
    setEquationDisplayMode('block');
  }

  function confirmEquationInsert() {
    if (!editor) return;

    const latex = equationLatex.trim();

    if (!latex) return;

    const editableEquationText = buildEditableEquationText(latex);

    if (!editableEquationText) return;

    if (equationDialogMode === 'edit' && typeof editingEquationPos === 'number') {
      const targetNode = editor.state.doc.nodeAt(editingEquationPos);

      if (targetNode?.type.name === 'editableEquation') {
        const transaction = editor.state.tr.replaceWith(
          editingEquationPos,
          editingEquationPos + targetNode.nodeSize,
          editor.state.schema.text(editableEquationText)
        );

        const nextPosition = editingEquationPos + editableEquationText.length;
        transaction.setSelection(TextSelection.create(transaction.doc, nextPosition));
        editor.view.dispatch(transaction.scrollIntoView());
        editor.view.focus();
        notifyEditorChange();
        closeEquationDialog();
        return;
      }
    }

    insertEditableEquationText(editor, latex);
    notifyEditorChange();
    closeEquationDialog();
  }

  function insertSymbol(value?: string) {
    if (value) {
      insertHtml(escapeHtml(value));
      return;
    }

    const symbol = window.prompt('Symbol:', 'Ω');

    if (!symbol) return;

    insertHtml(escapeHtml(symbol));
  }

  function getHeadingLevelFilterForToc(tocType: TableOfContentsPreset): number[] {
    if (tocType !== 'custom') return [1, 2, 3, 4, 5, 6];

    const levelInput = window.prompt(
      'Include heading levels for Custom TOC. Example: 1,2,3 or 1-6',
      '1,2,3,4,5,6'
    );

    if (!levelInput?.trim()) return [1, 2, 3, 4, 5, 6];

    const normalized = levelInput.replace(/\s+/g, '');

    if (/^[1-6]-[1-6]$/.test(normalized)) {
      const [from, to] = normalized.split('-').map(Number);
      const startLevel = Math.min(from, to);
      const endLevel = Math.max(from, to);
      return Array.from({ length: endLevel - startLevel + 1 }, (_, index) => startLevel + index);
    }

    const levels = normalized
      .split(',')
      .map((item) => Number(item))
      .filter((level) => Number.isInteger(level) && level >= 1 && level <= 6);

    return levels.length > 0 ? Array.from(new Set(levels)).sort((a, b) => a - b) : [1, 2, 3, 4, 5, 6];
  }

  function getDocumentHeadingsForToc(tocType: TableOfContentsPreset) {
    if (!editor) return [];

    const html = editor.getHTML();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const allowedLevels = getHeadingLevelFilterForToc(tocType);

    return Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .map((heading, index) => {
        const level = Number(heading.tagName.replace('H', ''));
        const text = heading.textContent?.trim() || `Heading ${index + 1}`;
        const id = heading.id || `toc-heading-${index + 1}`;

        return {
          id,
          text,
          level,
          index,
        };
      })
      .filter((heading) => allowedLevels.includes(heading.level));
  }

  function buildNumberedTocPrefix(
    heading: { level: number },
    counters: number[]
  ) {
    counters[heading.level - 1] += 1;

    for (let index = heading.level; index < counters.length; index += 1) {
      counters[index] = 0;
    }

    return counters.slice(0, heading.level).filter((value) => value > 0).join('.');
  }

  function insertTableOfContents(tocType: TableOfContentsPreset = selectedTableOfContents) {
    if (!editor) return;

    const documentHeadings = getDocumentHeadingsForToc(tocType);

    const sampleHeadings = [
      { id: 'toc-sample-overview', text: 'Course / Document Overview', level: 1, index: 0 },
      { id: 'toc-sample-objectives', text: 'Learning Objectives', level: 2, index: 1 },
      { id: 'toc-sample-unit-one', text: 'Unit 1: Introduction', level: 2, index: 2 },
      { id: 'toc-sample-topic-one', text: 'Key Concepts', level: 3, index: 3 },
      { id: 'toc-sample-activity', text: 'Activity / Assignment', level: 3, index: 4 },
      { id: 'toc-sample-assessment', text: 'Assessment Plan', level: 2, index: 5 },
      { id: 'toc-sample-resources', text: 'References and Resources', level: 2, index: 6 },
      { id: 'toc-sample-appendix', text: 'Appendix', level: 1, index: 7 },
    ];

    const headings = documentHeadings.length > 0 ? documentHeadings : sampleHeadings;
    const usingSampleTocContent = documentHeadings.length === 0;

    const tocTitle = tableOfContentsOptions.find((option) => option.value === tocType)?.label || 'Table of Contents';
    const itemIndent = (level: number) => Math.max(level - 1, 0) * 18;
    const compactHeadings = headings.slice(0, 8);
    const editableTocNote = usingSampleTocContent
      ? '<p style="margin:0 0 12px;color:#64748b;font-size:12px;text-align:center;">Sample editable TOC inserted. Replace these entries or add headings and insert again.</p>'
      : '';

    let tocHtml = '';

    if (tocType === 'classicHeading') {
      tocHtml = `
        <section data-toc-type="classic-heading" style="border:1px solid #d7dee2;border-radius:12px;padding:18px 20px;margin:18px 0;background:#ffffff;">
          <h2 style="margin:0 0 12px;text-align:center;">Table of Contents</h2>
          ${editableTocNote}
          <ol style="margin:0;padding-left:22px;">
            ${headings
              .map((heading) => `<li style="margin:6px 0 6px ${itemIndent(heading.level)}px;">${escapeHtml(heading.text)}</li>`)
              .join('')}
          </ol>
        </section>
      `;
    } else if (tocType === 'numbered') {
      const counters = [0, 0, 0, 0, 0, 0];
      tocHtml = `
        <section data-toc-type="numbered" style="border:1px solid #d7dee2;border-radius:12px;padding:18px 20px;margin:18px 0;background:#ffffff;">
          <h2 style="margin:0 0 12px;text-align:center;">Numbered Table of Contents</h2>
          ${editableTocNote}
          <div style="display:grid;gap:7px;">
            ${headings
              .map((heading) => {
                const prefix = buildNumberedTocPrefix(heading, counters);
                return `<p style="margin:0 0 0 ${itemIndent(heading.level)}px;"><strong>${escapeHtml(prefix)}</strong>&nbsp;&nbsp;${escapeHtml(heading.text)}</p>`;
              })
              .join('')}
          </div>
        </section>
      `;
    } else if (tocType === 'bullet') {
      tocHtml = `
        <section data-toc-type="bullet" style="border:1px solid #d7dee2;border-radius:12px;padding:18px 20px;margin:18px 0;background:#ffffff;">
          <h2 style="margin:0 0 12px;">Bullet Table of Contents</h2>
          ${editableTocNote}
          <ul style="margin:0;padding-left:22px;">
            ${headings
              .map((heading) => `<li style="margin:6px 0 6px ${itemIndent(heading.level)}px;">${escapeHtml(heading.text)}</li>`)
              .join('')}
          </ul>
        </section>
      `;
    } else if (tocType === 'expandable') {
      tocHtml = `
        <section data-toc-type="expandable" style="border:1px solid #d7dee2;border-radius:12px;padding:18px 20px;margin:18px 0;background:#ffffff;">
          <h2 style="margin:0 0 12px;">Expandable Table of Contents</h2>
          ${editableTocNote}
          <details open style="border:1px solid #e5eaee;border-radius:10px;padding:12px;background:#f8fafc;">
            <summary style="font-weight:700;cursor:pointer;">Show / Hide contents</summary>
            <div style="margin-top:10px;display:grid;gap:7px;">
              ${headings
                .map((heading) => `<p style="margin:0 0 0 ${itemIndent(heading.level)}px;">${escapeHtml(heading.text)}</p>`)
                .join('')}
            </div>
          </details>
        </section>
      `;
    } else if (tocType === 'stickySidebar') {
      tocHtml = `
        <aside data-toc-type="sticky-sidebar" style="width:260px;border:1px solid #d7dee2;border-radius:14px;padding:16px;margin:18px 18px 18px 0;background:#f8fafc;position:sticky;top:16px;float:left;">
          <h3 style="margin:0 0 12px;">Sticky Sidebar TOC</h3>
          ${editableTocNote}
          <nav style="display:grid;gap:7px;">
            ${headings
              .map((heading) => `<a href="#${escapeHtml(heading.id)}" style="display:block;margin-left:${itemIndent(heading.level)}px;color:#174f84;text-decoration:none;">${escapeHtml(heading.text)}</a>`)
              .join('')}
          </nav>
        </aside>
        <p style="clear:both;margin:0;"></p>
      `;
    } else if (tocType === 'interactiveHyperlinked') {
      tocHtml = `
        <section data-toc-type="interactive-hyperlinked" style="border:1px solid #d7dee2;border-radius:12px;padding:18px 20px;margin:18px 0;background:#ffffff;">
          <h2 style="margin:0 0 12px;text-align:center;">Interactive Hyperlinked Table of Contents</h2>
          ${editableTocNote}
          <ol style="margin:0;padding-left:22px;">
            ${headings
              .map((heading) => `<li style="margin:6px 0 6px ${itemIndent(heading.level)}px;"><a href="#${escapeHtml(heading.id)}" style="color:#174f84;text-decoration:underline;">${escapeHtml(heading.text)}</a></li>`)
              .join('')}
          </ol>
        </section>
      `;
    } else if (tocType === 'treeView') {
      tocHtml = `
        <section data-toc-type="tree-view" style="border:1px solid #d7dee2;border-radius:12px;padding:18px 20px;margin:18px 0;background:#ffffff;">
          <h2 style="margin:0 0 12px;">Tree View Table of Contents</h2>
          ${editableTocNote}
          <div style="font-family:Consolas, 'Courier New', monospace;display:grid;gap:6px;">
            ${headings
              .map((heading) => `<p style="margin:0 0 0 ${itemIndent(heading.level)}px;">${heading.level === 1 ? '▾' : '└─'} ${escapeHtml(heading.text)}</p>`)
              .join('')}
          </div>
        </section>
      `;
    } else if (tocType === 'mini') {
      tocHtml = `
        <section data-toc-type="mini" style="border:1px solid #d7dee2;border-radius:12px;padding:14px 16px;margin:14px 0;background:#f8fafc;">
          <h3 style="margin:0 0 10px;">Mini Table of Contents</h3>
          ${editableTocNote}
          <ul style="margin:0;padding-left:20px;">
            ${compactHeadings
              .map((heading) => `<li style="margin:4px 0 4px ${itemIndent(heading.level)}px;">${escapeHtml(heading.text)}</li>`)
              .join('')}
          </ul>
        </section>
      `;
    } else if (tocType === 'pageNumber') {
      tocHtml = `
        <section data-toc-type="page-number" style="border:1px solid #d7dee2;border-radius:12px;padding:18px 20px;margin:18px 0;background:#ffffff;">
          <h2 style="margin:0 0 12px;text-align:center;">Table of Contents</h2>
          ${editableTocNote}
          <table style="width:100%;border-collapse:collapse;">
            <tbody>
              ${headings
                .map((heading, index) => `<tr>
                  <td style="border:0;padding:5px 0 5px ${itemIndent(heading.level)}px;">${escapeHtml(heading.text)}</td>
                  <td style="border:0;padding:5px 8px;text-align:center;color:#94a3b8;">${'.'.repeat(Math.max(8, 44 - heading.text.length))}</td>
                  <td style="border:0;padding:5px 0;text-align:right;width:52px;">${index + 1}</td>
                </tr>`)
                .join('')}
            </tbody>
          </table>
        </section>
      `;
    } else {
      tocHtml = `
        <section data-toc-type="custom" style="border:1px solid #d7dee2;border-radius:12px;padding:18px 20px;margin:18px 0;background:#ffffff;">
          <h2 style="margin:0 0 12px;text-align:center;">${escapeHtml(tocTitle)}</h2>
          ${editableTocNote}
          <ol style="margin:0;padding-left:22px;">
            ${headings
              .map((heading) => `<li style="margin:6px 0 6px ${itemIndent(heading.level)}px;">H${heading.level} - ${escapeHtml(heading.text)}</li>`)
              .join('')}
          </ol>
        </section>
      `;
    }

    insertHtml(tocHtml);
  }

  function triggerTocImportClick() {
    tocImportInputRef.current?.click();
  }

  function buildEditableImportedTocHtml(
    fileName: string,
    sourceType: string,
    lines: string[],
    imagePreview?: string,
    structuredRows?: string[][]
  ) {
    const hasStructuredRows = Array.isArray(structuredRows) && structuredRows.length > 0;

    const fallbackRows = lines.length > 0
      ? lines.slice(0, 24)
      : [
          '1 Course Overview 3',
          '1.1 Learning Objectives 4',
          '1.2 Target Learners 5',
          '2 Module Structure 6',
          '2.1 Unit 1: Introduction 7',
          '2.2 Unit 2: Practice Activities 9',
          '2.3 Unit 3: Assessment Tasks 12',
          '3 Assessment Plan 14',
          '3.1 Rubric and Evaluation 15',
          '4 References 18',
          '5 Appendix 20',
        ];

    const normalizeCell = (value: string) => value.replace(/\s+/g, ' ').trim();

    const importedRows = hasStructuredRows
      ? structuredRows
          ?.map((row) => row.map((cell) => normalizeCell(cell)))
          .filter((row) => row.some((cell) => cell.length > 0))
          .slice(0, 40) || []
      : fallbackRows.map((line, index) => {
          const normalizedLine = normalizeCell(line);
          const pageMatch = normalizedLine.match(/(?:\.{2,}|\s)(\d+)\s*$/);
          const pageNumber = pageMatch?.[1] || String(index + 1);
          const withoutPage = pageMatch
            ? normalizedLine.slice(0, pageMatch.index).replace(/\.{2,}\s*$/g, '').trim()
            : normalizedLine;
          const numberMatch = withoutPage.match(/^(\d+(?:\.\d+)*\.?)(?:\s+)(.+)$/);
          const sectionNumber = numberMatch?.[1]?.replace(/\.$/, '') || String(index + 1);
          const sectionTitle = numberMatch?.[2]?.trim() || withoutPage || `TOC item ${index + 1}`;

          return [sectionNumber, sectionTitle, pageNumber];
        });

    const headerRow = importedRows[0] || ['No.', 'Section Title', 'Page'];
    const firstRowLooksLikeHeader = headerRow.some((cell) => /^(no\.?|number|section|title|page)$/i.test(cell));
    const bodyRows = firstRowLooksLikeHeader ? importedRows.slice(1) : importedRows;

    const safeHeader = firstRowLooksLikeHeader
      ? [headerRow[0] || 'No.', headerRow[1] || 'Section Title', headerRow[2] || 'Page']
      : ['No.', 'Section Title', 'Page'];

    const bodyHtml = bodyRows
      .map((row, index) => {
        const no = row[0] || String(index + 1);
        const title = row[1] || row[0] || `TOC item ${index + 1}`;
        const page = row[2] || '';

        return `
          <tr>
            <td style="width:78px;border:1px solid #111827;padding:5px 8px;text-align:center;vertical-align:top;">${escapeHtml(no)}</td>
            <td style="border:1px solid #111827;padding:5px 8px;vertical-align:top;">${escapeHtml(title)}</td>
            <td style="width:78px;border:1px solid #111827;padding:5px 8px;text-align:center;vertical-align:top;">${escapeHtml(page)}</td>
          </tr>
        `;
      })
      .join('');

    const imageBlock = imagePreview
      ? `
        <p style="margin:0 0 10px;text-align:center;color:#4b5563;font-size:12px;">Image imported. Edit the extracted TOC table below.</p>
      `
      : '';

    return `
      <section data-toc-type="imported" data-import-source="${escapeHtml(sourceType)}" style="margin:18px 0;background:#ffffff;color:#111827;">
        <h2 style="margin:0 0 8px;text-align:center;color:#111827;font-size:24px;line-height:32px;font-weight:700;">Imported Table of Contents</h2>
        <p style="margin:0 0 14px;text-align:center;color:#4b5563;font-size:12px;">Source: ${escapeHtml(fileName)}. This table is editable.</p>
        ${imageBlock}
        <table style="width:100%;border-collapse:collapse;margin:0;background:#ffffff;color:#111827;">
          <thead>
            <tr>
              <th style="width:78px;border:1px solid #111827;padding:5px 8px;background:#ffffff;color:#111827;text-align:center;font-weight:700;">${escapeHtml(safeHeader[0])}</th>
              <th style="border:1px solid #111827;padding:5px 8px;background:#ffffff;color:#111827;text-align:center;font-weight:700;">${escapeHtml(safeHeader[1])}</th>
              <th style="width:78px;border:1px solid #111827;padding:5px 8px;background:#ffffff;color:#111827;text-align:center;font-weight:700;">${escapeHtml(safeHeader[2])}</th>
            </tr>
          </thead>
          <tbody>${bodyHtml}</tbody>
        </table>
        <p style="margin:12px 0 0;color:#4b5563;font-size:12px;font-style:italic;">Edit the TOC rows directly in the table.</p>
      </section>
    `;
  }

  function getImportedTocLinesFromText(textValue: string) {
    if (!textValue.trim()) return [];

    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(textValue, 'text/html');
    const bodyText = htmlDoc.body?.textContent?.trim() ? htmlDoc.body.textContent : textValue;

    return bodyText
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter((line) => line.length > 0)
      .filter((line) => !/^table of contents$/i.test(line))
      .filter((line) => line.length <= 140)
      .slice(0, 24);
  }

  type TocZipEntry = {
    name: string;
    compressionMethod: number;
    compressedSize: number;
    uncompressedSize: number;
    localHeaderOffset: number;
  };

  function readUint16(view: DataView, offset: number) {
    return view.getUint16(offset, true);
  }

  function readUint32(view: DataView, offset: number) {
    return view.getUint32(offset, true);
  }

  function readDocxZipEntries(buffer: ArrayBuffer) {
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);
    const decoder = new TextDecoder('utf-8');
    let endOffset = -1;

    for (let offset = bytes.length - 22; offset >= 0; offset -= 1) {
      if (readUint32(view, offset) === 0x06054b50) {
        endOffset = offset;
        break;
      }
    }

    if (endOffset < 0) throw new Error('Invalid DOCX file.');

    const totalEntries = readUint16(view, endOffset + 10);
    let centralDirectoryOffset = readUint32(view, endOffset + 16);
    const entries: TocZipEntry[] = [];

    for (let index = 0; index < totalEntries; index += 1) {
      if (readUint32(view, centralDirectoryOffset) !== 0x02014b50) break;

      const compressionMethod = readUint16(view, centralDirectoryOffset + 10);
      const compressedSize = readUint32(view, centralDirectoryOffset + 20);
      const uncompressedSize = readUint32(view, centralDirectoryOffset + 24);
      const fileNameLength = readUint16(view, centralDirectoryOffset + 28);
      const extraLength = readUint16(view, centralDirectoryOffset + 30);
      const commentLength = readUint16(view, centralDirectoryOffset + 32);
      const localHeaderOffset = readUint32(view, centralDirectoryOffset + 42);
      const fileNameBytes = bytes.slice(centralDirectoryOffset + 46, centralDirectoryOffset + 46 + fileNameLength);
      const name = decoder.decode(fileNameBytes);

      entries.push({
        name,
        compressionMethod,
        compressedSize,
        uncompressedSize,
        localHeaderOffset,
      });

      centralDirectoryOffset += 46 + fileNameLength + extraLength + commentLength;
    }

    return { entries, bytes, view };
  }

  async function inflateRawDeflate(data: Uint8Array) {
    const DecompressionStreamConstructor = (globalThis as unknown as {
      DecompressionStream?: new (format: string) => TransformStream<Uint8Array, Uint8Array>;
    }).DecompressionStream;

    if (!DecompressionStreamConstructor) {
      throw new Error('DOCX decompression is not supported in this browser.');
    }

    const safeBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
    const stream = new Blob([safeBuffer]).stream().pipeThrough(new DecompressionStreamConstructor('deflate-raw'));
    const buffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(buffer);
  }

  async function extractDocxZipEntryText(buffer: ArrayBuffer, targetName: string) {
    const { entries, bytes, view } = readDocxZipEntries(buffer);
    const entry = entries.find((item) => item.name === targetName);

    if (!entry) return '';
    if (readUint32(view, entry.localHeaderOffset) !== 0x04034b50) return '';

    const fileNameLength = readUint16(view, entry.localHeaderOffset + 26);
    const extraLength = readUint16(view, entry.localHeaderOffset + 28);
    const dataStart = entry.localHeaderOffset + 30 + fileNameLength + extraLength;
    const compressedBytes = bytes.slice(dataStart, dataStart + entry.compressedSize);
    const uncompressedBytes = entry.compressionMethod === 0
      ? compressedBytes
      : entry.compressionMethod === 8
        ? await inflateRawDeflate(compressedBytes)
        : new Uint8Array();

    if (entry.uncompressedSize > 0 && uncompressedBytes.length === 0) return '';

    return new TextDecoder('utf-8').decode(uncompressedBytes);
  }

  function extractTextFromDocxElement(element: Element) {
    return Array.from(element.getElementsByTagName('*'))
      .filter((node) => node.localName === 't')
      .map((node) => node.textContent || '')
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function extractTocRowsFromDocxXml(xmlText: string) {
    if (!xmlText.trim()) return [];

    const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');
    const tables = Array.from(xmlDoc.getElementsByTagName('*')).filter((node) => node.localName === 'tbl');

    for (const table of tables) {
      const rows = Array.from(table.getElementsByTagName('*'))
        .filter((node) => node.localName === 'tr')
        .map((row) => {
          const cells = Array.from(row.children)
            .filter((child) => child.localName === 'tc')
            .map((cell) => extractTextFromDocxElement(cell));

          if (cells.length >= 3) return [cells[0], cells[1], cells[2]];
          if (cells.length === 2) return [cells[0], cells[1], ''];
          if (cells.length === 1) return ['', cells[0], ''];
          return [];
        })
        .filter((row) => row.length > 0 && row.some((cell) => cell.trim().length > 0));

      if (rows.length > 0) return rows;
    }

    return [];
  }

  async function getImportedTocRowsFromDocx(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const documentXml = await extractDocxZipEntryText(arrayBuffer, 'word/document.xml');
    return extractTocRowsFromDocxXml(documentXml);
  }

  async function handleTocImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !editor) return;

    const fileName = file.name || 'Imported TOC file';
    const fileType = file.type || '';
    const lowerFileName = fileName.toLowerCase();

    try {
      if (fileType.startsWith('image/')) {
        const imagePreview = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        insertHtml(buildEditableImportedTocHtml(fileName, 'image', [], imagePreview));
        return;
      }

      if (lowerFileName.endsWith('.docx')) {
        const docxRows = await getImportedTocRowsFromDocx(file);
        insertHtml(buildEditableImportedTocHtml(fileName, 'docx', [], undefined, docxRows));
        return;
      }

      if (
        fileType.startsWith('text/') ||
        lowerFileName.endsWith('.txt') ||
        lowerFileName.endsWith('.md') ||
        lowerFileName.endsWith('.html') ||
        lowerFileName.endsWith('.htm') ||
        lowerFileName.endsWith('.rtf') ||
        lowerFileName.endsWith('.csv')
      ) {
        const textValue = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
          reader.onerror = () => reject(reader.error);
          reader.readAsText(file);
        });

        const lines = getImportedTocLinesFromText(textValue);
        insertHtml(buildEditableImportedTocHtml(fileName, 'text', lines));
        return;
      }

      insertHtml(buildEditableImportedTocHtml(fileName, 'document', []));
    } catch (err) {
      console.error('TOC import failed:', err);
      insertHtml(buildEditableImportedTocHtml(fileName, 'import-error', []));
    } finally {
      if (tocImportInputRef.current) tocImportInputRef.current.value = '';
    }
  }


  function triggerDocumentImportClick() {
    documentImportInputRef.current?.click();
  }

  async function extractDocxZipEntryBytes(buffer: ArrayBuffer, targetName: string) {
    const { entries, bytes, view } = readDocxZipEntries(buffer);
    const entry = entries.find((item) => item.name === targetName);

    if (!entry) return null;
    if (readUint32(view, entry.localHeaderOffset) !== 0x04034b50) return null;

    const fileNameLength = readUint16(view, entry.localHeaderOffset + 26);
    const extraLength = readUint16(view, entry.localHeaderOffset + 28);
    const dataStart = entry.localHeaderOffset + 30 + fileNameLength + extraLength;
    const compressedBytes = bytes.slice(dataStart, dataStart + entry.compressedSize);
    const uncompressedBytes = entry.compressionMethod === 0
      ? compressedBytes
      : entry.compressionMethod === 8
        ? await inflateRawDeflate(compressedBytes)
        : new Uint8Array();

    if (entry.uncompressedSize > 0 && uncompressedBytes.length === 0) return null;

    return uncompressedBytes;
  }

  function getDocxNodeLocalChildren(element: Element, localName: string) {
    return Array.from(element.children).filter((child) => child.localName === localName);
  }

  function getDocxFirstDescendant(element: Element, localName: string) {
    return Array.from(element.getElementsByTagName('*')).find((node) => node.localName === localName) || null;
  }

  function getDocxAttribute(element: Element | null, localName: string) {
    if (!element) return '';

    for (let index = 0; index < element.attributes.length; index += 1) {
      const attribute = element.attributes[index];
      if (attribute.localName === localName) return attribute.value;
    }

    return '';
  }

  function getDocxParagraphStyleValue(paragraph: Element) {
    const styleNode = Array.from(paragraph.getElementsByTagName('*')).find((node) => node.localName === 'pStyle');
    return getDocxAttribute(styleNode || null, 'val').toLowerCase();
  }

  function getDocxParagraphTag(paragraph: Element) {
    const styleValue = getDocxParagraphStyleValue(paragraph);

    if (styleValue.includes('heading1') || styleValue === 'title') return 'h1';
    if (styleValue.includes('heading2') || styleValue.includes('subtitle')) return 'h2';
    if (styleValue.includes('heading3')) return 'h3';
    if (styleValue.includes('heading4')) return 'h4';
    if (styleValue.includes('heading5')) return 'h5';
    if (styleValue.includes('heading6')) return 'h6';

    return 'p';
  }

  type ImportedDocxListInfo = {
    type: 'ul' | 'ol';
    level: number;
  };

  function parseDocxNumberingTypes(numberingXml: string) {
    const numIdToAbstractId: Record<string, string> = {};
    const abstractIdToType: Record<string, 'ul' | 'ol'> = {};

    if (!numberingXml.trim()) return {} as Record<string, 'ul' | 'ol'>;

    const numberingDoc = new DOMParser().parseFromString(numberingXml, 'application/xml');

    Array.from(numberingDoc.getElementsByTagName('*'))
      .filter((node) => node.localName === 'abstractNum')
      .forEach((abstractNode) => {
        const abstractId = getDocxAttribute(abstractNode, 'abstractNumId');
        const formatNode = Array.from(abstractNode.getElementsByTagName('*')).find((node) => node.localName === 'numFmt');
        const formatValue = getDocxAttribute(formatNode || null, 'val').toLowerCase();

        if (abstractId) {
          abstractIdToType[abstractId] = formatValue === 'bullet' ? 'ul' : 'ol';
        }
      });

    Array.from(numberingDoc.getElementsByTagName('*'))
      .filter((node) => node.localName === 'num')
      .forEach((numNode) => {
        const numId = getDocxAttribute(numNode, 'numId');
        const abstractNumIdNode = Array.from(numNode.getElementsByTagName('*')).find((node) => node.localName === 'abstractNumId');
        const abstractId = getDocxAttribute(abstractNumIdNode || null, 'val');

        if (numId && abstractId) numIdToAbstractId[numId] = abstractId;
      });

    return Object.fromEntries(
      Object.entries(numIdToAbstractId).map(([numId, abstractId]) => [numId, abstractIdToType[abstractId] || 'ol'])
    ) as Record<string, 'ul' | 'ol'>;
  }

  function getDocxParagraphListInfo(
    paragraph: Element,
    numberingTypes: Record<string, 'ul' | 'ol'>
  ): ImportedDocxListInfo | null {
    const styleValue = getDocxParagraphStyleValue(paragraph);
    const numPr = Array.from(paragraph.getElementsByTagName('*')).find((node) => node.localName === 'numPr');
    const ilvlNode = numPr ? Array.from(numPr.getElementsByTagName('*')).find((node) => node.localName === 'ilvl') : null;
    const numIdNode = numPr ? Array.from(numPr.getElementsByTagName('*')).find((node) => node.localName === 'numId') : null;
    const numId = getDocxAttribute(numIdNode || null, 'val');
    const levelValue = Number(getDocxAttribute(ilvlNode || null, 'val') || '0');
    const level = Number.isFinite(levelValue) && levelValue >= 0 ? levelValue : 0;

    if (styleValue.includes('listbullet') || styleValue.includes('bullet')) {
      return { type: 'ul', level };
    }

    if (styleValue.includes('listnumber') || styleValue.includes('numbered') || styleValue.includes('numbering')) {
      return { type: 'ol', level };
    }

    if (numId) {
      return { type: numberingTypes[numId] || 'ol', level };
    }

    return null;
  }

  function getDocxParagraphAlign(paragraph: Element) {
    const alignNode = Array.from(paragraph.getElementsByTagName('*')).find((node) => node.localName === 'jc');
    const value = getDocxAttribute(alignNode || null, 'val');

    if (value === 'center') return 'text-align:center;';
    if (value === 'right' || value === 'end') return 'text-align:right;';
    if (value === 'both') return 'text-align:justify;';

    return '';
  }

  function getDocxCellSpan(cell: Element) {
    const gridSpan = Array.from(cell.getElementsByTagName('*')).find((node) => node.localName === 'gridSpan');
    const colSpan = Number(getDocxAttribute(gridSpan || null, 'val') || '1');
    return Number.isFinite(colSpan) && colSpan > 1 ? colSpan : 1;
  }

  function getMimeTypeFromDocxPath(pathName: string) {
    const lowerPath = pathName.toLowerCase();

    if (lowerPath.endsWith('.png')) return 'image/png';
    if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) return 'image/jpeg';
    if (lowerPath.endsWith('.gif')) return 'image/gif';
    if (lowerPath.endsWith('.webp')) return 'image/webp';
    if (lowerPath.endsWith('.svg')) return 'image/svg+xml';
    if (lowerPath.endsWith('.bmp')) return 'image/bmp';

    return 'application/octet-stream';
  }

  function bytesToBase64(bytes: Uint8Array) {
    let binary = '';
    const chunkSize = 0x8000;

    for (let index = 0; index < bytes.length; index += chunkSize) {
      const chunk = bytes.subarray(index, index + chunkSize);
      binary += String.fromCharCode(...Array.from(chunk));
    }

    return window.btoa(binary);
  }

  async function buildDocxImageDataUrl(buffer: ArrayBuffer, mediaPath: string) {
    const normalizedPath = mediaPath.startsWith('word/') ? mediaPath : `word/${mediaPath.replace(/^\.\.\//, '')}`;
    const bytes = await extractDocxZipEntryBytes(buffer, normalizedPath);

    if (!bytes) return '';

    return `data:${getMimeTypeFromDocxPath(normalizedPath)};base64,${bytesToBase64(bytes)}`;
  }

  function parseDocxRelationships(relationshipsXml: string) {
    const relationships: Record<string, string> = {};

    if (!relationshipsXml.trim()) return relationships;

    const xmlDoc = new DOMParser().parseFromString(relationshipsXml, 'application/xml');
    Array.from(xmlDoc.getElementsByTagName('*'))
      .filter((node) => node.localName === 'Relationship')
      .forEach((relationship) => {
        const idValue = relationship.getAttribute('Id') || '';
        const targetValue = relationship.getAttribute('Target') || '';

        if (idValue && targetValue) relationships[idValue] = targetValue;
      });

    return relationships;
  }

  async function convertDocxParagraphContentToHtml(
    paragraph: Element,
    buffer: ArrayBuffer,
    relationships: Record<string, string>
  ) {
    const runs = getDocxNodeLocalChildren(paragraph, 'r');
    let paragraphHtml = '';

    for (const run of runs) {
      const textParts = Array.from(run.getElementsByTagName('*'))
        .filter((node) => node.localName === 't' || node.localName === 'tab' || node.localName === 'br')
        .map((node) => {
          if (node.localName === 'tab') return '&nbsp;&nbsp;&nbsp;&nbsp;';
          if (node.localName === 'br') return '<br />';
          return escapeHtml(node.textContent || '');
        });

      const blip = Array.from(run.getElementsByTagName('*')).find((node) => node.localName === 'blip');
      const embedId = blip ? getDocxAttribute(blip, 'embed') || getDocxAttribute(blip, 'link') : '';

      if (embedId && relationships[embedId]) {
        const target = relationships[embedId];

        if (target.includes('media/')) {
          const imageUrl = await buildDocxImageDataUrl(buffer, target);

          if (imageUrl) {
            paragraphHtml += `<figure style="margin:14px 0;text-align:center;"><img src="${imageUrl}" alt="Imported image" style="max-width:100%;height:auto;border-radius:8px;" /></figure>`;
          }
        } else if (target.includes('charts/')) {
          paragraphHtml += `<div data-imported-chart="true" style="border:1px dashed #94a3b8;border-radius:10px;padding:14px;margin:12px 0;background:#f8fafc;"><strong>Imported chart placeholder</strong><br />Edit or replace this chart content as needed.</div>`;
        }
      }

      if (textParts.length > 0) {
        let runHtml = textParts.join('');
        const runProperties = getDocxFirstDescendant(run, 'rPr');

        if (runProperties) {
          const isBold = Boolean(getDocxFirstDescendant(runProperties, 'b'));
          const isItalic = Boolean(getDocxFirstDescendant(runProperties, 'i'));
          const isUnderline = Boolean(getDocxFirstDescendant(runProperties, 'u'));

          if (isUnderline) runHtml = `<u>${runHtml}</u>`;
          if (isItalic) runHtml = `<em>${runHtml}</em>`;
          if (isBold) runHtml = `<strong>${runHtml}</strong>`;
        }

        paragraphHtml += runHtml;
      }
    }

    return paragraphHtml.trim() ? paragraphHtml : '&nbsp;';
  }

  async function convertDocxParagraphToHtml(
    paragraph: Element,
    buffer: ArrayBuffer,
    relationships: Record<string, string>
  ) {
    const tagName = getDocxParagraphTag(paragraph);
    const alignStyle = getDocxParagraphAlign(paragraph);
    const paragraphHtml = await convertDocxParagraphContentToHtml(paragraph, buffer, relationships);

    return `<${tagName} style="${alignStyle}">${paragraphHtml}</${tagName}>`;
  }

  async function convertDocxTableToHtml(
    table: Element,
    buffer: ArrayBuffer,
    relationships: Record<string, string>
  ) {
    const rows = getDocxNodeLocalChildren(table, 'tr');
    const rowHtmlParts: string[] = [];

    for (const row of rows) {
      const cells = getDocxNodeLocalChildren(row, 'tc');
      const cellHtmlParts: string[] = [];

      for (const cell of cells) {
        const colSpan = getDocxCellSpan(cell);
        const cellBlocks: string[] = [];

        for (const child of Array.from(cell.children)) {
          if (child.localName === 'p') {
            cellBlocks.push(await convertDocxParagraphToHtml(child, buffer, relationships));
          } else if (child.localName === 'tbl') {
            cellBlocks.push(await convertDocxTableToHtml(child, buffer, relationships));
          }
        }

        cellHtmlParts.push(`<td${colSpan > 1 ? ` colspan="${colSpan}"` : ''}>${cellBlocks.join('') || '&nbsp;'}</td>`);
      }

      rowHtmlParts.push(`<tr>${cellHtmlParts.join('')}</tr>`);
    }

    return `<table data-imported-document-table="true" style="width:100%;border-collapse:collapse;margin:16px 0;"><tbody>${rowHtmlParts.join('')}</tbody></table>`;
  }

  async function convertDocxFileToEditableHtml(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const documentXml = await extractDocxZipEntryText(arrayBuffer, 'word/document.xml');
    const relationshipsXml = await extractDocxZipEntryText(arrayBuffer, 'word/_rels/document.xml.rels');
    const numberingXml = await extractDocxZipEntryText(arrayBuffer, 'word/numbering.xml');
    const relationships = parseDocxRelationships(relationshipsXml);
    const numberingTypes = parseDocxNumberingTypes(numberingXml);

    if (!documentXml.trim()) {
      throw new Error('The DOCX document content could not be read.');
    }

    const xmlDoc = new DOMParser().parseFromString(documentXml, 'application/xml');
    const body = Array.from(xmlDoc.getElementsByTagName('*')).find((node) => node.localName === 'body');
    const htmlBlocks: string[] = [];

    if (!body) return '<p>The document body could not be imported.</p>';

    let activeListType: 'ul' | 'ol' | null = null;
    let activeListItems: string[] = [];

    const flushActiveList = () => {
      if (!activeListType || activeListItems.length === 0) return;
      htmlBlocks.push(`<${activeListType} style="margin:0 0 16px 24px;padding-left:24px;">${activeListItems.join('')}</${activeListType}>`);
      activeListType = null;
      activeListItems = [];
    };

    for (const child of Array.from(body.children)) {
      if (child.localName === 'p') {
        const listInfo = getDocxParagraphListInfo(child, numberingTypes);

        if (listInfo) {
          const itemHtml = await convertDocxParagraphContentToHtml(child, arrayBuffer, relationships);

          if (activeListType && activeListType !== listInfo.type) flushActiveList();

          activeListType = listInfo.type;
          activeListItems.push(`<li><p>${itemHtml}</p></li>`);
        } else {
          flushActiveList();
          htmlBlocks.push(await convertDocxParagraphToHtml(child, arrayBuffer, relationships));
        }
      } else if (child.localName === 'tbl') {
        flushActiveList();
        htmlBlocks.push(await convertDocxTableToHtml(child, arrayBuffer, relationships));
      }
    }

    flushActiveList();

    return htmlBlocks.join('') || '<p>The DOCX file did not contain readable document content.</p>';
  }

  function buildImportedDocumentWrapper(fileName: string, bodyHtml: string, sourceType: string) {
    return `
      <section data-imported-document="true" data-imported-document-source="${escapeHtml(sourceType)}" style="margin:0 0 20px;padding:0;background:#ffffff;">
        <p style="margin:0 0 14px;color:#64748b;font-size:12px;line-height:18px;"><strong>Imported file:</strong> ${escapeHtml(fileName)}. Content below is editable.</p>
        ${bodyHtml}
      </section>
    `;
  }

  function buildPlainTextImportHtml(fileName: string, textValue: string) {
    const paragraphs = textValue
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
      .join('');

    return buildImportedDocumentWrapper(fileName, paragraphs || '<p>&nbsp;</p>', 'text');
  }

  async function buildPdfImportHtml(file: File) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () =>
        resolve(
          typeof reader.result === 'string'
            ? reader.result
            : ''
        );

      reader.onerror = () =>
        reject(
          reader.error ||
            new Error(
              'Unable to prepare the PDF preview.'
            )
        );

      reader.readAsDataURL(file);
    });

    type PdfTextItem = {
      text: string;
      x: number;
      y: number;
      width: number;
      height: number;
      fontSize: number;
      fontName: string;
      hasEol: boolean;
    };

    type PdfTextLine = {
      items: PdfTextItem[];
      text: string;
      x: number;
      y: number;
      width: number;
      fontSize: number;
      fontName: string;
      bold: boolean;
      italic: boolean;
      alignment: 'left' | 'center' | 'right';
    };

    function getMedian(values: number[]) {
      if (values.length === 0) return 11;

      const sorted = [...values].sort(
        (left, right) => left - right
      );

      const middle =
        Math.floor(sorted.length / 2);

      if (sorted.length % 2 === 0) {
        return (
          sorted[middle - 1] +
          sorted[middle]
        ) / 2;
      }

      return sorted[middle];
    }

    function normalisePdfText(value: string) {
      return value
        .replace(/\u00ad/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function createPdfTextItem(
      item: unknown
    ): PdfTextItem | null {
      if (
        !item ||
        typeof item !== 'object' ||
        !('str' in item)
      ) {
        return null;
      }

      const source = item as {
        str?: unknown;
        transform?: unknown;
        width?: unknown;
        height?: unknown;
        fontName?: unknown;
        hasEOL?: unknown;
      };

      const textValue =
        normalisePdfText(
          typeof source.str === 'string'
            ? source.str
            : ''
        );

      if (!textValue) {
        return null;
      }

      const transform =
        Array.isArray(source.transform)
          ? source.transform.map((value) =>
              Number(value || 0)
            )
          : [];

      const scaleX =
        Math.hypot(
          Number(transform[0] || 0),
          Number(transform[1] || 0)
        ) || 1;

      const scaleY =
        Math.hypot(
          Number(transform[2] || 0),
          Number(transform[3] || 0)
        ) || scaleX;

      return {
        text: textValue,
        x: Number(transform[4] || 0),
        y: Number(transform[5] || 0),
        width: Math.max(
          Number(source.width || 0),
          textValue.length * scaleX * 0.35
        ),
        height: Math.max(
          Number(source.height || 0),
          scaleY
        ),
        fontSize: Math.max(
          6,
          Math.min(72, scaleY)
        ),
        fontName:
          typeof source.fontName === 'string'
            ? source.fontName
            : '',
        hasEol: Boolean(source.hasEOL),
      };
    }

    function groupPdfItemsIntoLines(
      items: PdfTextItem[],
      pageWidth: number
    ): PdfTextLine[] {
      const sortedItems = [...items].sort(
        (left, right) => {
          const verticalDifference =
            right.y - left.y;

          if (
            Math.abs(verticalDifference) > 2
          ) {
            return verticalDifference;
          }

          return left.x - right.x;
        }
      );

      const groupedLines: PdfTextItem[][] = [];

      for (const item of sortedItems) {
        const lastLine =
          groupedLines[groupedLines.length - 1];

        if (!lastLine) {
          groupedLines.push([item]);
          continue;
        }

        const lineY =
          lastLine.reduce(
            (total, lineItem) =>
              total + lineItem.y,
            0
          ) / lastLine.length;

        const lineFontSize =
          lastLine.reduce(
            (total, lineItem) =>
              total + lineItem.fontSize,
            0
          ) / lastLine.length;

        const tolerance = Math.max(
          2.5,
          Math.min(
            7,
            Math.max(
              lineFontSize,
              item.fontSize
            ) * 0.35
          )
        );

        if (
          Math.abs(lineY - item.y) <=
          tolerance
        ) {
          lastLine.push(item);
        } else {
          groupedLines.push([item]);
        }
      }

      return groupedLines
        .map((lineItems) => {
          const orderedItems =
            [...lineItems].sort(
              (left, right) =>
                left.x - right.x
            );

          let textValue = '';
          let previousItem:
            | PdfTextItem
            | null = null;

          for (const item of orderedItems) {
            if (!previousItem) {
              textValue = item.text;
              previousItem = item;
              continue;
            }

            const previousEnd =
              previousItem.x +
              previousItem.width;

            const gap =
              item.x - previousEnd;

            const normalSpaceWidth =
              Math.max(
                2,
                Math.min(
                  previousItem.fontSize,
                  item.fontSize
                ) * 0.24
              );

            const needsSpace =
              gap > normalSpaceWidth ||
              (!/[-/\u2013\u2014]$/.test(
                textValue
              ) &&
                !/^[,.;:!?%)\]}]/.test(
                  item.text
                ));

            textValue += `${
              needsSpace ? ' ' : ''
            }${item.text}`;

            previousItem = item;
          }

          const x =
            Math.min(
              ...orderedItems.map(
                (item) => item.x
              )
            );

          const rightEdge =
            Math.max(
              ...orderedItems.map(
                (item) =>
                  item.x + item.width
              )
            );

          const width =
            Math.max(0, rightEdge - x);

          const y =
            orderedItems.reduce(
              (total, item) =>
                total + item.y,
              0
            ) / orderedItems.length;

          const fontSize =
            orderedItems.reduce(
              (total, item) =>
                total + item.fontSize,
              0
            ) / orderedItems.length;

          const representativeFont =
            orderedItems
              .map((item) => item.fontName)
              .find(Boolean) || '';

          const fontDescriptor =
            orderedItems
              .map((item) => item.fontName)
              .join(' ')
              .toLowerCase();

          const bold =
            /(bold|black|heavy|semibold|demi)/i.test(
              fontDescriptor
            );

          const italic =
            /(italic|oblique)/i.test(
              fontDescriptor
            );

          const lineCentre =
            x + width / 2;

          const pageCentre =
            pageWidth / 2;

          const centreDifference =
            Math.abs(
              lineCentre - pageCentre
            );

          let alignment:
            | 'left'
            | 'center'
            | 'right' = 'left';

          if (
            width < pageWidth * 0.86 &&
            centreDifference <
              pageWidth * 0.055
          ) {
            alignment = 'center';
          } else if (
            x > pageWidth * 0.52
          ) {
            alignment = 'right';
          }

          return {
            items: orderedItems,
            text: normalisePdfText(
              textValue
            ),
            x,
            y,
            width,
            fontSize,
            fontName:
              representativeFont,
            bold,
            italic,
            alignment,
          };
        })
        .filter((line) => line.text);
    }

    function getPdfFontFamily(
      fontName: string
    ) {
      const lowerFontName =
        fontName.toLowerCase();

      if (
        lowerFontName.includes('times') ||
        lowerFontName.includes('serif') ||
        lowerFontName.includes('cambria') ||
        lowerFontName.includes('georgia')
      ) {
        return 'Georgia, "Times New Roman", serif';
      }

      if (
        lowerFontName.includes('courier') ||
        lowerFontName.includes('mono') ||
        lowerFontName.includes('consolas')
      ) {
        return '"Courier New", Consolas, monospace';
      }

      return 'Arial, Helvetica, sans-serif';
    }

    function createStyledPdfText(
      line: PdfTextLine,
      bodyFontSize: number
    ) {
      const relativeSize =
        Math.max(
          0.72,
          Math.min(
            2.8,
            line.fontSize /
              Math.max(bodyFontSize, 1)
          )
        );

      const fontSizePx =
        Math.max(
          10,
          Math.min(
            34,
            bodyFontSize *
              relativeSize *
              1.12
          )
        );

      const styleParts = [
        `font-family:${getPdfFontFamily(
          line.fontName
        )}`,
        `font-size:${fontSizePx.toFixed(
          1
        )}px`,
        `font-weight:${
          line.bold ? '700' : '400'
        }`,
        `font-style:${
          line.italic
            ? 'italic'
            : 'normal'
        }`,
      ];

      const escapedText =
        escapeHtml(line.text);

      if (line.bold) {
        return `<strong style="${styleParts.join(
          ';'
        )}">${escapedText}</strong>`;
      }

      if (line.italic) {
        return `<em style="${styleParts.join(
          ';'
        )}">${escapedText}</em>`;
      }

      return `<span style="${styleParts.join(
        ';'
      )}">${escapedText}</span>`;
    }

    function createPdfLineHtml(
      line: PdfTextLine,
      bodyFontSize: number,
      pageWidth: number,
      previousLine:
        | PdfTextLine
        | null,
      isHeader = false,
      isFooter = false
    ) {
      const relativeSize =
        line.fontSize /
        Math.max(bodyFontSize, 1);

      const shortLine =
        line.text.length <= 140;

      const isHeadingOne =
        !isHeader &&
        !isFooter &&
        shortLine &&
        relativeSize >= 1.62;

      const isHeadingTwo =
        !isHeader &&
        !isFooter &&
        shortLine &&
        !isHeadingOne &&
        relativeSize >= 1.34;

      const isHeadingThree =
        !isHeader &&
        !isFooter &&
        shortLine &&
        !isHeadingOne &&
        !isHeadingTwo &&
        relativeSize >= 1.15 &&
        (line.bold ||
          line.alignment === 'center');

      const orderedListMatch =
        line.text.match(
          /^\s*(\d+|[A-Za-z]|[ivxlcdmIVXLCDM]+)[.)]\s+(.+)$/
        );

      const bulletListMatch =
        line.text.match(
          /^\s*([•●▪■◦○◆◇\-–—])\s+(.+)$/
        );

      const topGap =
        previousLine
          ? Math.max(
              0,
              previousLine.y -
                line.y -
                previousLine.fontSize
            )
          : 0;

      const marginTop =
        Math.max(
          isHeadingOne ||
            isHeadingTwo ||
            isHeadingThree
            ? 14
            : 2,
          Math.min(22, topGap * 0.75)
        );

      const leftIndent =
        Math.max(
          0,
          Math.min(
            90,
            (line.x / pageWidth) * 100
          )
        );

      const baseStyle = [
        `margin:${marginTop.toFixed(
          1
        )}px 0 5px`,
        `text-align:${line.alignment}`,
        `line-height:1.35`,
        `padding-left:${
          line.alignment === 'left'
            ? Math.max(
                0,
                Math.min(
                  72,
                  leftIndent - 6
                )
              ).toFixed(1)
            : '0'
        }px`,
        'overflow-wrap:anywhere',
      ].join(';');

      const styledText =
        createStyledPdfText(
          line,
          bodyFontSize
        );

      if (isHeader) {
        return `
          <p
            data-imported-pdf-header="true"
            style="${baseStyle};margin:0 0 14px;padding:0 0 8px;border-bottom:1px solid #cbd5e1;color:#475569;font-size:10px;"
          >
            ${styledText}
          </p>
        `;
      }

      if (isFooter) {
        return `
          <p
            data-imported-pdf-footer="true"
            style="${baseStyle};margin:18px 0 0;padding:8px 0 0;border-top:1px solid #cbd5e1;color:#64748b;font-size:10px;"
          >
            ${styledText}
          </p>
        `;
      }

      if (orderedListMatch) {
        return `
          <ol
            start="${
              /^\d+$/.test(
                orderedListMatch[1]
              )
                ? orderedListMatch[1]
                : '1'
            }"
            style="margin:${marginTop.toFixed(
              1
            )}px 0 6px ${Math.max(
              24,
              Math.min(
                76,
                leftIndent + 18
              )
            ).toFixed(1)}px;padding-left:18px;"
          >
            <li>${escapeHtml(
              orderedListMatch[2]
            )}</li>
          </ol>
        `;
      }

      if (bulletListMatch) {
        return `
          <ul
            style="margin:${marginTop.toFixed(
              1
            )}px 0 6px ${Math.max(
              24,
              Math.min(
                76,
                leftIndent + 18
              )
            ).toFixed(1)}px;padding-left:18px;"
          >
            <li>${escapeHtml(
              bulletListMatch[2]
            )}</li>
          </ul>
        `;
      }

      if (isHeadingOne) {
        return `
          <h1
            style="${baseStyle};font-size:${Math.max(
              22,
              line.fontSize * 1.12
            ).toFixed(
              1
            )}px;font-weight:700;"
          >
            ${styledText}
          </h1>
        `;
      }

      if (isHeadingTwo) {
        return `
          <h2
            style="${baseStyle};font-size:${Math.max(
              18,
              line.fontSize * 1.1
            ).toFixed(
              1
            )}px;font-weight:700;"
          >
            ${styledText}
          </h2>
        `;
      }

      if (isHeadingThree) {
        return `
          <h3
            style="${baseStyle};font-size:${Math.max(
              15,
              line.fontSize * 1.06
            ).toFixed(
              1
            )}px;font-weight:700;"
          >
            ${styledText}
          </h3>
        `;
      }

      return `
        <p style="${baseStyle}">
          ${styledText}
        </p>
      `;
    }

    let extractedPdfHtml = '';

    try {
      /*
       * PDF.js is loaded only in the browser. A top-level import
       * is evaluated during Next.js SSR and fails because Node
       * does not provide DOMMatrix.
       */
      const pdfjsLib =
        await import(
          'pdfjs-dist/legacy/build/pdf.mjs'
        );

      pdfjsLib.GlobalWorkerOptions.workerSrc =
        new URL(
          'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();

      const pdfBytes = new Uint8Array(
        await file.arrayBuffer()
      );

      const loadingTask =
        pdfjsLib.getDocument({
          data: pdfBytes,
        });

      const pdfDocument =
        await loadingTask.promise;

      const pageHtmlParts: string[] = [];
      let totalExtractedTextItems = 0;

      for (
        let pageNumber = 1;
        pageNumber <=
        pdfDocument.numPages;
        pageNumber += 1
      ) {
        const page =
          await pdfDocument.getPage(
            pageNumber
          );

        const viewport =
          page.getViewport({
            scale: 1,
          });

        const textContent =
          await page.getTextContent();

        const textItems =
          textContent.items
            .map((item) =>
              createPdfTextItem(item)
            )
            .filter(
              (
                item
              ): item is PdfTextItem =>
                Boolean(item)
            );

        totalExtractedTextItems +=
          textItems.length;

        const pageLines =
          groupPdfItemsIntoLines(
            textItems,
            viewport.width
          );

        const bodyCandidateLines =
          pageLines.filter(
            (line) =>
              line.y <=
                viewport.height * 0.9 &&
              line.y >=
                viewport.height * 0.1
          );

        const bodyFontSize =
          getMedian(
            (
              bodyCandidateLines.length > 0
                ? bodyCandidateLines
                : pageLines
            ).map(
              (line) =>
                line.fontSize
            )
          );

        const headerLines =
          pageLines.filter(
            (line) =>
              line.y >
              viewport.height * 0.9
          );

        const footerLines =
          pageLines.filter(
            (line) =>
              line.y <
              viewport.height * 0.1
          );

        const bodyLines =
          pageLines.filter(
            (line) =>
              !headerLines.includes(
                line
              ) &&
              !footerLines.includes(
                line
              )
          );

        const headerHtml =
          headerLines
            .map((line, index) =>
              createPdfLineHtml(
                line,
                bodyFontSize,
                viewport.width,
                index > 0
                  ? headerLines[
                      index - 1
                    ]
                  : null,
                true,
                false
              )
            )
            .join('');

        const bodyHtml =
          bodyLines.length > 0
            ? bodyLines
                .map(
                  (line, index) =>
                    createPdfLineHtml(
                      line,
                      bodyFontSize,
                      viewport.width,
                      index > 0
                        ? bodyLines[
                            index - 1
                          ]
                        : null
                    )
                )
                .join('')
            : `
                <p>
                  No extractable text was
                  found on this page.
                </p>
              `;

        const footerHtml =
          footerLines
            .map((line, index) =>
              createPdfLineHtml(
                line,
                bodyFontSize,
                viewport.width,
                index > 0
                  ? footerLines[
                      index - 1
                    ]
                  : null,
                false,
                true
              )
            )
            .join('');

        const pageAspectRatio =
          viewport.height /
          Math.max(
            viewport.width,
            1
          );

        const editorPageHeight =
          Math.max(
            720,
            Math.min(
              1180,
              760 *
                pageAspectRatio
            )
          );

        pageHtmlParts.push(`
          <section
            data-imported-pdf-page="${pageNumber}"
            data-imported-pdf-page-width="${viewport.width}"
            data-imported-pdf-page-height="${viewport.height}"
            style="box-sizing:border-box;max-width:794px;min-height:${editorPageHeight.toFixed(
              0
            )}px;margin:22px auto;padding:42px 54px 38px;background:#ffffff;border:1px solid #d1d5db;border-radius:2px;box-shadow:0 6px 18px rgba(15,23,42,0.12);font-family:Arial,Helvetica,sans-serif;color:#111827;"
          >
            ${
              headerHtml ||
              '<p data-imported-pdf-header="true" style="height:1px;margin:0 0 14px;padding:0;border-bottom:1px solid transparent;"></p>'
            }

            <div
              data-imported-pdf-body="true"
              style="min-height:${Math.max(
                520,
                editorPageHeight - 170
              ).toFixed(
                0
              )}px;"
            >
              ${bodyHtml}
            </div>

            ${footerHtml}
          </section>

          ${
            pageNumber <
            pdfDocument.numPages
              ? createPageBreakParagraph(
                  `Page ${pageNumber + 1}`,
                  '#64748b'
                )
              : ''
          }
        `);
      }

      extractedPdfHtml =
        totalExtractedTextItems > 0
          ? `
              <h2>
                Imported PDF Content
              </h2>

              <p
                style="color:#64748b;font-size:12px;"
              >
                The document was reconstructed
                page by page. Headings, font
                emphasis, alignment, headers,
                footers, indentation, lists, and
                page breaks are approximated from
                the PDF coordinates and font data.
              </p>

              ${pageHtmlParts.join('')}
            `
          : `
              <h2>
                No Editable Text Found
              </h2>

              <p>
                This PDF does not contain
                extractable text. It may be a
                scanned or image-only document.
              </p>
            `;
    } catch (pdfExtractError) {
      console.error(
        'PDF text extraction failed:',
        pdfExtractError
      );

      extractedPdfHtml = `
        <h2>
          PDF Text Extraction Failed
        </h2>

        <p>
          The PDF preview is available above,
          but its text could not be extracted
          for editing.
        </p>
      `;
    }

    return buildImportedDocumentWrapper(
      file.name || 'Imported PDF',
      `
        <div
          data-imported-pdf="true"
          contenteditable="false"
          style="border:1px solid #cbd5e1;border-radius:12px;overflow:hidden;margin:14px 0 24px;background:#f8fafc;"
        >
          <object
            data="${dataUrl}#view=FitH"
            type="application/pdf"
            style="width:100%;height:720px;display:block;"
          >
            <a href="${dataUrl}">
              Open imported PDF
            </a>
          </object>
        </div>

        ${extractedPdfHtml}
      `,
      'pdf'
    );
  }

  async function handleDocumentImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !editor) return;

    const fileName = file.name || 'Imported file';
    const lowerFileName = fileName.toLowerCase();
    const fileType = file.type || '';

    try {
      if (lowerFileName.endsWith('.docx')) {
        const docxHtml = await convertDocxFileToEditableHtml(file);
        insertHtml(buildImportedDocumentWrapper(fileName, docxHtml, 'docx'));
        return;
      }

      if (lowerFileName.endsWith('.pdf') || fileType === 'application/pdf') {
        const pdfHtml = await buildPdfImportHtml(file);
        insertHtml(pdfHtml);
        return;
      }

      if (
        lowerFileName.endsWith('.doc') ||
        lowerFileName.endsWith('.rtf') ||
        lowerFileName.endsWith('.txt') ||
        lowerFileName.endsWith('.md') ||
        lowerFileName.endsWith('.html') ||
        lowerFileName.endsWith('.htm') ||
        fileType.startsWith('text/')
      ) {
        const textValue = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
          reader.onerror = () => reject(reader.error);
          reader.readAsText(file);
        });

        insertHtml(buildPlainTextImportHtml(fileName, textValue));
        return;
      }

      insertHtml(buildImportedDocumentWrapper(fileName, '<p>This file type is not supported for editable import. Please upload DOCX, DOC, PDF, RTF, TXT, HTML, or Markdown.</p>', 'unsupported'));
    } catch (err) {
      console.error('Document import failed:', err);
      insertHtml(buildImportedDocumentWrapper(fileName, '<p>The file could not be imported. Please check the file format and try again.</p>', 'import-error'));
    } finally {
      if (documentImportInputRef.current) documentImportInputRef.current.value = '';
    }
  }

  function insertFootnote(type: 'footnote' | 'endnote') {
    if (!editor) return;

    const promptLabel = type === 'footnote' ? 'Footnote text:' : 'Endnote text:';
    const defaultText =
      type === 'footnote'
        ? 'Type footnote details here.'
        : 'Type endnote details here.';
    const note = window.prompt(promptLabel, defaultText);

    if (!note?.trim()) return;

    const existingTypeCount = editorFootnotes.filter((item) => item.type === type).length;
    const number = existingTypeCount + 1;
    const marker = formatFootnoteMarker(number, footnoteSettings.numberFormat);
    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const title = type === 'footnote' ? 'Footnotes' : 'Endnotes';
    const noteLabel = type === 'footnote' ? 'Footnote' : 'Endnote';
    const noteText = note.trim();

    const nextNote: EditorFootnote = {
      id,
      type,
      number,
      text: noteText,
      created_at: new Date().toISOString(),
    };

    setEditorFootnotes((current) => [...current, nextNote]);
    setShowNotesPanel(true);
    setActiveFootnoteIndex(editorFootnotes.length);

    const getVisibleMarker = (value: string) => {
      const superscriptMap: Record<string, string> = {
        '0': '⁰',
        '1': '¹',
        '2': '²',
        '3': '³',
        '4': '⁴',
        '5': '⁵',
        '6': '⁶',
        '7': '⁷',
        '8': '⁸',
        '9': '⁹',
      };

      if (/^\d+$/.test(value)) {
        return value
          .split('')
          .map((digit) => superscriptMap[digit] || digit)
          .join('');
      }

      return `[${value}]`;
    };

    const visibleMarker = getVisibleMarker(marker);

    editor
      .chain()
      .focus()
      .insertContent(visibleMarker)
      .run();

    const documentEndPosition = editor.state.doc.content.size;

    editor
      .chain()
      .focus()
      .insertContentAt(documentEndPosition, [
        {
          type: 'horizontalRule',
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: title,
              marks: [{ type: 'bold' }],
            },
          ],
        },
        {
          type: 'paragraph',
          attrs: {
            documentUtilityType: `note-${type}`,
            documentUtilityStyle: id,
          },
          content: [
            {
              type: 'text',
              text: `${marker} `,
            },
            {
              type: 'text',
              text: `${noteLabel} ${marker}:`,
              marks: [{ type: 'bold' }],
            },
            {
              type: 'text',
              text: ` ${noteText}`,
            },
          ],
        },
      ])
      .run();
  }

  function getFootnotesFromDocument() {
    if (!editor) return editorFootnotes;

    const html = editor.getHTML();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const noteItems = Array.from(doc.querySelectorAll('[data-note-item]'));

    if (noteItems.length === 0) return editorFootnotes;

    return noteItems.map((item, index) => {
      const id = item.getAttribute('data-note-item') || `note-${index + 1}`;
      const section = item.closest('[data-note-section]');
      const type = section?.getAttribute('data-note-section') === 'endnote' ? 'endnote' : 'footnote';
      const marker = item.querySelector('sup')?.textContent?.trim() || String(index + 1);
      const rawText = item.textContent?.replace(marker, '').trim() || '';
      const cleanedText = rawText.replace(/^Footnote\s+[^:]+:\s*/i, '').replace(/^Endnote\s+[^:]+:\s*/i, '');

      return {
        id,
        type,
        number: index + 1,
        text: cleanedText || rawText || 'Editable note text',
        created_at: new Date().toISOString(),
      } satisfies EditorFootnote;
    });
  }

  function goToNextFootnote() {
    if (!editor) return;

    const root = document.querySelector('.ProseMirror');
    const noteRefs = Array.from(root?.querySelectorAll<HTMLElement>('[data-note-ref], [data-document-utility-type^="note-"], [data-rendered-document-utility-type^="note-"]') || []);

    if (noteRefs.length === 0) {
      window.alert('No footnotes or endnotes found.');
      return;
    }

    const nextIndex = activeFootnoteIndex + 1 >= noteRefs.length ? 0 : activeFootnoteIndex + 1;
    const nextRef = noteRefs[nextIndex];

    setActiveFootnoteIndex(nextIndex);
    setShowNotesPanel(true);

    nextRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
    nextRef.classList.add('editor-note-ref-active');
    window.setTimeout(() => nextRef.classList.remove('editor-note-ref-active'), 1600);
  }

  function showDocumentNotes() {
    const latestNotes = getFootnotesFromDocument();
    setEditorFootnotes(latestNotes);
    setShowNotesPanel(true);
  }

  function convertNotes(nextType: EditorNoteType) {
    if (!editor) return;

    const html = editor.getHTML();
    const fromType = nextType === 'footnote' ? 'endnote' : 'footnote';
    const updatedHtml = html
      .replaceAll(`data-note-type="${fromType}"`, `data-note-type="${nextType}"`)
      .replaceAll(`data-note-section="${fromType}"`, `data-note-section="${nextType}"`)
      .replaceAll(fromType === 'footnote' ? 'Footnotes' : 'Endnotes', nextType === 'footnote' ? 'Footnotes' : 'Endnotes')
      .replaceAll(fromType === 'footnote' ? 'Footnote' : 'Endnote', nextType === 'footnote' ? 'Footnote' : 'Endnote');

    editor.commands.setContent(updatedHtml, { emitUpdate: false });
    setEditorFootnotes((current) => current.map((note) => ({ ...note, type: nextType })));
  }

  function renderFootnoteSettingsDialog() {
    if (!footnoteSettingsOpen) return null;

    return (
      <div className="footnoteDialogOverlay" role="dialog" aria-modal="true" aria-label="Footnote and endnote settings">
        <div className="footnoteDialog">
          <div className="footnoteDialogHeader">
            <strong>Footnote and Endnote Settings</strong>
            <button type="button" onClick={() => setFootnoteSettingsOpen(false)} aria-label="Close footnote settings">×</button>
          </div>

          <div className="footnoteDialogGrid">
            <label>
              <span>Number format</span>
              <select
                value={footnoteSettings.numberFormat}
                onChange={(event) =>
                  setFootnoteSettings((current) => ({
                    ...current,
                    numberFormat: event.target.value as FootnoteNumberFormat,
                  }))
                }
              >
                {footnoteNumberFormatOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Footnote location</span>
              <select
                value={footnoteSettings.footnoteLocation}
                onChange={(event) =>
                  setFootnoteSettings((current) => ({
                    ...current,
                    footnoteLocation: event.target.value as FootnoteSettings['footnoteLocation'],
                  }))
                }
              >
                <option value="bottom-of-page">Bottom of page</option>
                <option value="below-text">Below text</option>
              </select>
            </label>

            <label>
              <span>Endnote location</span>
              <select
                value={footnoteSettings.endnoteLocation}
                onChange={(event) =>
                  setFootnoteSettings((current) => ({
                    ...current,
                    endnoteLocation: event.target.value as FootnoteSettings['endnoteLocation'],
                  }))
                }
              >
                <option value="end-of-document">End of document</option>
                <option value="end-of-section">End of section</option>
              </select>
            </label>

            <label>
              <span>Restart numbering</span>
              <select
                value={footnoteSettings.restartRule}
                onChange={(event) =>
                  setFootnoteSettings((current) => ({
                    ...current,
                    restartRule: event.target.value as FootnoteSettings['restartRule'],
                  }))
                }
              >
                <option value="continuous">Continuous</option>
                <option value="each-section">Restart each section</option>
                <option value="each-page">Restart each page</option>
              </select>
            </label>
          </div>

          <div className="footnoteDialogActions">
            <button type="button" onClick={() => convertNotes('footnote')}>Convert All to Footnotes</button>
            <button type="button" onClick={() => convertNotes('endnote')}>Convert All to Endnotes</button>
            <button type="button" onClick={() => setFootnoteSettingsOpen(false)}>Apply</button>
          </div>
        </div>
      </div>
    );
  }


  function insertCitation() {
    const citation = window.prompt('Citation text, for example: Smith, 2024');
    if (!citation?.trim()) return;

    const source: CitationSource = {
      id: Math.random().toString(36).substring(2, 9),
      label: citation.trim(),
      citation: `(${citation.trim()})`,
      created_at: new Date().toISOString(),
    };

    const nextSources = [source, ...citationSources];

    setCitationSources(nextSources);
    insertHtml(`<span data-citation="true">${escapeHtml(source.citation)}</span>`);

    if (storageKey) {
      window.localStorage.setItem(`${storageKey}_citations`, JSON.stringify(nextSources));
    }
  }

  function insertBibliography() {
    if (citationSources.length === 0) {
      insertHtml('<h2>Bibliography</h2><p>No citation sources added yet.</p>');
      return;
    }

    const sourceHtml = citationSources
      .map((source) => `<li>${escapeHtml(source.label)}</li>`)
      .join('');

    insertHtml(`<h2>Bibliography</h2><ol>${sourceHtml}</ol>`);
  }

  function insertCaption() {
    const caption = window.prompt('Caption text:', 'Figure 1. Caption');
    if (!caption?.trim()) return;

    insertHtml(`<p><strong>${escapeHtml(caption.trim())}</strong></p>`);
  }

  function insertTableOfFigures() {
    insertHtml(`
      <h2>Table of Figures</h2>
      <p>Insert captions first, then update this section manually as required.</p>
    `);
  }

  function markIndexEntry() {
    const term = window.prompt('Index entry:');
    if (!term?.trim()) return;

    insertHtml(`<span data-index-entry="${escapeHtml(term.trim())}">${escapeHtml(term.trim())}</span>`);
  }

  function insertIndex() {
    if (!editor) return;

    const html = editor.getHTML();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const entries = Array.from(doc.querySelectorAll('[data-index-entry]'))
      .map((entry) => entry.getAttribute('data-index-entry'))
      .filter(Boolean) as string[];

    const uniqueEntries = Array.from(new Set(entries));

    if (uniqueEntries.length === 0) {
      insertHtml('<h2>Index</h2><p>No marked index entries found.</p>');
      return;
    }

    insertHtml(`
      <h2>Index</h2>
      <ul>${uniqueEntries.map((entry) => `<li>${escapeHtml(entry)}</li>`).join('')}</ul>
    `);
  }

  function markCitationForAuthority() {
    const citation = window.prompt('Authority citation:');
    if (!citation?.trim()) return;

    insertHtml(`<span data-authority-citation="true">${escapeHtml(citation.trim())}</span>`);
  }

  function insertTableOfAuthorities() {
    insertHtml(`
      <h2>Table of Authorities</h2>
      <p>Marked legal citations will appear here after review.</p>
    `);
  }

  function insertEnvelopeBlock() {
    insertHtml(`
      <table>
        <tbody>
          <tr><th>Recipient</th><th>Sender</th></tr>
          <tr>
            <td>Name:<br />Address:<br />City:</td>
            <td>Name:<br />Address:<br />City:</td>
          </tr>
        </tbody>
      </table>
    `);
  }

  function insertMailMergeField() {
    const field = window.prompt('Mail merge field name:', 'FirstName');
    if (!field?.trim()) return;

    insertHtml(`<span data-mail-merge-field="true">«${escapeHtml(field.trim())}»</span>`);
  }

  function insertLabelSheet() {
    insertHtml(`
      <table>
        <tbody>
          <tr><td>Label 1</td><td>Label 2</td><td>Label 3</td></tr>
          <tr><td>Label 4</td><td>Label 5</td><td>Label 6</td></tr>
          <tr><td>Label 7</td><td>Label 8</td><td>Label 9</td></tr>
        </tbody>
      </table>
    `);
  }

  function runAccessibilityCheck() {
    if (!editor) return;

    const html = editor.getHTML();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const imagesMissingAlt = Array.from(doc.querySelectorAll('img')).filter(
      (img) => !img.getAttribute('alt')
    ).length;

    const emptyHeadings = Array.from(doc.querySelectorAll('h1, h2, h3, h4')).filter(
      (heading) => !heading.textContent?.trim()
    ).length;

    const issues = [
      imagesMissingAlt
        ? `${imagesMissingAlt} image(s) need alt text.`
        : 'All images have acceptable alt text status.',
      emptyHeadings
        ? `${emptyHeadings} heading(s) are empty.`
        : 'No empty headings found.',
    ];

    window.alert(`Accessibility Check\n\n${issues.join('\n')}`);
  }

  function addAltTextToImages() {
    if (!editor) return;

    const altText = window.prompt('Alt text for selected or inserted image:');
    if (!altText?.trim()) return;

    const html = editor.getHTML();
    const nextHtml = html.replace(/<img([^>]*?)>/, (match, attrs) => {
      if (attrs.includes(' alt=')) return match;
      return `<img${attrs} alt="${escapeHtml(altText.trim())}">`;
    });

    (editor.commands as any).setContent(nextHtml, true);
    notifyEditorChange();
  }

  function showNavigationPane() {
    if (!editor) return;

    const html = editor.getHTML();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4'));

    if (headings.length === 0) {
      window.alert('Navigation Pane\n\nNo headings found.');
      return;
    }

    window.alert(
      `Navigation Pane\n\n${headings
        .map((heading) => `• ${heading.textContent?.trim() || 'Untitled heading'}`)
        .join('\n')}`
    );
  }

function readAloud() {
  const activeValue = getLatestValue();

  if (typeof window === 'undefined') return;

  const speechSynthesisApi = window.speechSynthesis as SpeechSynthesis | undefined;
  const SpeechSynthesisUtteranceCtor = window.SpeechSynthesisUtterance as
    | typeof SpeechSynthesisUtterance
    | undefined;

  if (!speechSynthesisApi || !SpeechSynthesisUtteranceCtor) {
    globalThis.alert?.('Read Aloud is not supported in this browser.');
    return;
  }

  speechSynthesisApi.cancel();

  const utterance = new SpeechSynthesisUtteranceCtor(
    activeValue.plain_text || 'No document text.'
  );

  speechSynthesisApi.speak(utterance);
}

  function stopReadAloud() {
    if (typeof window === 'undefined') return;

    const speechSynthesisApi = window.speechSynthesis as SpeechSynthesis | undefined;

    if (speechSynthesisApi) {
      speechSynthesisApi.cancel();
    }
  }

  function showWordCountDialog() {
    const activeValue = getLatestValue();
    const stats = calculateEditorStats(activeValue.plain_text);

    window.alert(
      `Word Count\n\nWords: ${stats.words}\nCharacters: ${stats.characters}\nLines: ${stats.lines}\nReading time: ${stats.readingTime} min`
    );
  }

  function runSpellingGrammarBasicCheck() {
    const activeValue = getLatestValue();
    const issues: string[] = [];

    if (/\s{2,}/.test(activeValue.plain_text)) {
      issues.push('Double spaces found.');
    }

    if (/\s+[,.]/.test(activeValue.plain_text)) {
      issues.push('Space before comma or period found.');
    }

    if (!activeValue.plain_text.trim()) {
      issues.push('Document is empty.');
    }

    window.alert(
      issues.length
        ? `Spelling & Grammar Basic Check\n\n${issues.join('\n')}`
        : 'Spelling & Grammar Basic Check\n\nNo basic spacing issues found.'
    );
  }

  function insertReviewComment() {
    const note = window.prompt('Comment:');
    if (!note?.trim()) return;

    const c: EditorComment = {
      id: Math.random().toString(36).substring(2, 9),
      text: note.trim(),
      created_at: new Date().toISOString(),
    };

    const nextComments = [c, ...comments];

    setComments(nextComments);

    if (storageKey) {
      window.localStorage.setItem(`${storageKey}_comments`, JSON.stringify(nextComments));
    }

    insertHtml(`<mark data-comment-id="${c.id}">[Comment: ${escapeHtml(note.trim())}]</mark>`);
  }

  function acceptChanges() {
    setTrackChangesEnabled(false);
    window.alert('Changes accepted. Track Changes is now off.');
  }

  function rejectChanges() {
    setTrackChangesEnabled(false);
    window.alert('Tracked changes rejected. Track Changes is now off.');
  }

  function compareSnapshot() {
    if (versions.length === 0) {
      window.alert('No snapshot is available for comparison.');
      return;
    }

    const activeValue = getLatestValue();
    const latestVersion = versions[0];

    window.alert(
      `Compare\n\nCurrent words: ${calculateEditorStats(activeValue.plain_text).words}\nLatest snapshot words: ${calculateEditorStats(latestVersion.value.plain_text).words}`
    );
  }

  function restrictEditing() {
    window.alert('Restrict Editing\n\nThis editor can be locked by setting the disabled prop to true.');
  }

  function applyTheme(
    theme:
      | 'academic'
      | 'university'
      | 'college'
      | 'school'
      | 'government'
      | 'ngo'
      | 'corporate'
      | 'skillAcademy'
      | 'bootcamp'
      | 'research'
      | 'publishing'
      | 'certificate'
      | 'report'
      | 'minimal'
  ) {
    const pageBaseStyle =
      'max-width:794px;margin:0 auto 28px;padding:46px 54px;min-height:960px;border:1px solid #d1d5db;background:#ffffff;color:#111827;font-family:Segoe UI, Arial, sans-serif;line-height:1.55;box-sizing:border-box;';
    const coverTitleStyle =
      'margin:0;text-align:center;font-size:28px;line-height:1.25;font-weight:800;letter-spacing:.02em;color:#174f84;text-transform:uppercase;';
    const subTitleStyle =
      'margin:8px 0 0;text-align:center;font-size:14px;font-weight:700;color:#4b5563;letter-spacing:.04em;text-transform:uppercase;';
    const sectionTitleStyle =
      'margin:28px 0 10px;font-size:18px;line-height:1.3;font-weight:800;color:#174f84;border-bottom:2px solid #10ab7c;padding-bottom:6px;';
    const labelCellStyle =
      'width:34%;padding:9px 12px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:800;color:#2a354f;vertical-align:top;';
    const valueCellStyle =
      'padding:9px 12px;border:1px solid #cbd5e1;color:#111827;vertical-align:top;';
    const tableStyle =
      'width:100%;border-collapse:collapse;margin:18px 0;font-size:13px;line-height:1.45;';
    const signatureGridStyle =
      'display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:46px;text-align:center;font-size:13px;';
    const signatureLineStyle =
      'border-top:1px solid #111827;padding-top:8px;font-weight:700;color:#2a354f;';

    const metadataRows = (rows: [string, string][]) =>
      `<table style="${tableStyle}"><tbody>${rows
        .map(
          ([label, value]) =>
            `<tr><td style="${labelCellStyle}">${label}</td><td style="${valueCellStyle}">${value}</td></tr>`
        )
        .join('')}</tbody></table>`;

    const signatureBlock = (labels: string[]) =>
      `<div style="${signatureGridStyle}">${labels
        .map((label) => `<div style="${signatureLineStyle}">${label}</div>`)
        .join('')}</div>`;

    const section = (title: string, body: string) =>
      `<h2 style="${sectionTitleStyle}">${title}</h2>${body}`;

    const coverHeader = (title: string, subtitle: string) => `
      <div style="text-align:center;margin:0 0 42px;">
        <div style="width:86px;height:86px;margin:0 auto 18px;border:2px dashed #94a3b8;border-radius:14px;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:12px;font-weight:800;">LOGO</div>
        <h1 style="${coverTitleStyle}">${title}</h1>
        <p style="${subTitleStyle}">${subtitle}</p>
      </div>
    `;

    const templates: Record<typeof theme, string> = {
      academic: `
        <div style="${pageBaseStyle}">
          ${coverHeader('Academic Assignment', 'Editable LMS Academic Document')}
          ${metadataRows([
            ['Institution', '[Institution / College / University Name]'],
            ['Department', '[Department Name]'],
            ['Course Code', '[Course Code]'],
            ['Course Title', '[Course Title]'],
            ['Submitted By', '[Student Name]'],
            ['Register / Roll Number', '[Register Number]'],
            ['Submitted To', '[Faculty Name]'],
            ['Semester / Batch', '[Semester / Batch]'],
            ['Academic Year', '[Academic Year]'],
          ])}
          ${section('Assignment Title', '<p style="margin:0 0 12px;">[Type the assignment title here.]</p>')}
          ${section('Introduction', '<p style="margin:0 0 12px;text-align:justify;">[Write the introduction here.]</p>')}
          ${section('Main Content', '<p style="margin:0 0 12px;text-align:justify;">[Write the main answer or explanation here.]</p>')}
          ${section('Conclusion', '<p style="margin:0 0 12px;text-align:justify;">[Write the conclusion here.]</p>')}
          ${section('References', '<ol style="margin:0 0 0 22px;"><li>[Reference 1]</li><li>[Reference 2]</li></ol>')}
        </div>
      `,
      university: `
        <div style="${pageBaseStyle}">
          ${coverHeader('University Report', 'School / Faculty / Department Template')}
          ${metadataRows([
            ['University', '[University Name]'],
            ['School / Faculty', '[School / Faculty Name]'],
            ['Department', '[Department Name]'],
            ['Programme', '[Programme Name]'],
            ['Course', '[Course Name]'],
            ['Credits', '[Credits]'],
            ['Semester', '[Semester]'],
            ['Prepared By', '[Name]'],
          ])}
          ${section('Course / Programme Context', '<p style="text-align:justify;">[Describe the university course or programme context.]</p>')}
          ${section('Learning Objectives', '<ul><li>[Objective 1]</li><li>[Objective 2]</li><li>[Objective 3]</li></ul>')}
          ${section('Assessment / Evaluation Plan', metadataRows([
            ['Assessment Type', '[Assignment / Quiz / Project / Exam]'],
            ['Weightage', '[%]'],
            ['Submission Mode', '[Online / Offline]'],
          ]))}
          ${signatureBlock(['Prepared By', 'Reviewed By', 'Approved By'])}
        </div>
      `,
      college: `
        <div style="${pageBaseStyle}">
          ${coverHeader('College Academic Document', 'Department / Course / Batch Template')}
          ${metadataRows([
            ['College', '[College Name]'],
            ['Department', '[Department Name]'],
            ['Course', '[Course Name]'],
            ['Subject', '[Subject Name]'],
            ['Faculty', '[Faculty Name]'],
            ['Section', '[Section]'],
            ['Batch', '[Batch]'],
            ['Academic Year', '[Academic Year]'],
          ])}
          ${section('Topic', '<p>[Enter topic title.]</p>')}
          ${section('Content', '<p style="text-align:justify;">[Enter editable content here.]</p>')}
          ${section('Outcome Mapping', metadataRows([
            ['CO / CLO', '[Course Outcome]'],
            ['Bloom Level', '[Remember / Understand / Apply / Analyze / Evaluate / Create]'],
            ['Marks / Weightage', '[Marks]'],
          ]))}
          ${signatureBlock(['Student', 'Faculty', 'Coordinator'])}
        </div>
      `,
      school: `
        <div style="${pageBaseStyle}">
          ${coverHeader('School Worksheet', 'Classroom Learning Template')}
          ${metadataRows([
            ['School', '[School Name]'],
            ['Class', '[Class]'],
            ['Section', '[Section]'],
            ['Subject', '[Subject]'],
            ['Teacher', '[Teacher Name]'],
            ['Student Name', '[Student Name]'],
            ['Roll Number', '[Roll Number]'],
            ['Date', '[Date]'],
          ])}
          ${section('Learning Goal', '<p>[What the student should learn.]</p>')}
          ${section('Instructions', '<ol><li>Read each question carefully.</li><li>Write clear answers in the space provided.</li></ol>')}
          ${section('Questions', '<p>1. [Question]</p><p>2. [Question]</p><p>3. [Question]</p>')}
          ${signatureBlock(['Student Signature', 'Teacher Signature', 'Parent Signature'])}
        </div>
      `,
      government: `
        <div style="${pageBaseStyle}">
          <div style="text-align:center;border-bottom:3px double #111827;padding-bottom:18px;margin-bottom:24px;">
            <h1 style="${coverTitleStyle}">Government / Department Name</h1>
            <p style="${subTitleStyle}">Official Circular / Order / Notice</p>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;font-size:13px;">
            <p style="margin:0;"><strong>Ref No.:</strong> [Reference Number]</p>
            <p style="margin:0;text-align:right;"><strong>Date:</strong> [Date]</p>
            <p style="margin:0;"><strong>File No.:</strong> [File Number]</p>
            <p style="margin:0;text-align:right;"><strong>Office:</strong> [Office Name]</p>
          </div>
          ${section('Subject', '<p style="font-weight:700;">[Enter subject line here.]</p>')}
          ${section('Background', '<p style="text-align:justify;">[Enter background note.]</p>')}
          ${section('Order / Instruction', '<ol><li>[Instruction 1]</li><li>[Instruction 2]</li><li>[Instruction 3]</li></ol>')}
          ${section('Compliance Requirement', '<p>[Enter compliance requirement and timeline.]</p>')}
          ${section('Distribution List', '<p>[Departments / Officers / Stakeholders]</p>')}
          <div style="margin-top:54px;text-align:right;">
            <p style="margin:0 0 46px;font-weight:700;">Authorized Signatory</p>
            <p style="margin:0;"><strong>Name:</strong> [Name]</p>
            <p style="margin:0;"><strong>Designation:</strong> [Designation]</p>
            <p style="margin:0;"><strong>Seal:</strong> [Seal]</p>
          </div>
        </div>
      `,
      ngo: `
        <div style="${pageBaseStyle}">
          ${coverHeader('NGO Project Report', 'Impact / Beneficiary / Donor Reporting Template')}
          ${metadataRows([
            ['Organization', '[NGO / Trust Name]'],
            ['Project', '[Project Name]'],
            ['Donor / CSR Partner', '[Donor Name]'],
            ['Reporting Period', '[Month / Quarter / Year]'],
            ['Location', '[Location]'],
            ['Coordinator', '[Coordinator Name]'],
            ['Beneficiary Group', '[Beneficiary Category]'],
            ['Prepared By', '[Name]'],
          ])}
          ${section('Executive Summary', '<p style="text-align:justify;">[Summarize key activities and impact.]</p>')}
          ${section('Objectives', '<ul><li>[Objective 1]</li><li>[Objective 2]</li></ul>')}
          ${section('Activities Completed', '<table style="' + tableStyle + '"><tbody><tr><td style="' + labelCellStyle + '">Activity</td><td style="' + valueCellStyle + '">Outcome / Evidence</td></tr><tr><td style="' + valueCellStyle + '">[Activity]</td><td style="' + valueCellStyle + '">[Outcome]</td></tr></tbody></table>')}
          ${section('Impact', '<p>[Add beneficiary count, outcomes, and field evidence.]</p>')}
          ${section('Challenges and Recommendations', '<p>[Add challenges and next steps.]</p>')}
          ${signatureBlock(['Prepared By', 'Project Coordinator', 'Authorized Signatory'])}
        </div>
      `,
      corporate: `
        <div style="${pageBaseStyle}">
          <div style="display:grid;grid-template-columns:110px 1fr;gap:18px;align-items:center;border-bottom:2px solid #174f84;padding-bottom:18px;margin-bottom:24px;">
            <div style="width:96px;height:72px;border:2px dashed #94a3b8;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:12px;font-weight:800;">LOGO</div>
            <div>
              <h1 style="margin:0;font-size:26px;line-height:1.25;color:#174f84;">Corporate Training / Policy Document</h1>
              <p style="margin:6px 0 0;color:#64748b;font-weight:700;">Editable business document layout</p>
            </div>
          </div>
          ${metadataRows([
            ['Company', '[Company Name]'],
            ['Department', '[Department Name]'],
            ['Document No.', '[DOC-001]'],
            ['Version', '[1.0]'],
            ['Classification', '[Internal / Confidential / Public]'],
            ['Prepared By', '[Name]'],
            ['Reviewed By', '[Name]'],
            ['Approved By', '[Name]'],
          ])}
          ${section('Executive Summary', '<p style="text-align:justify;">[Write summary here.]</p>')}
          ${section('Scope', '<p>[Define scope, audience, and applicability.]</p>')}
          ${section('Process / Policy Details', '<ol><li>[Step / Policy Point 1]</li><li>[Step / Policy Point 2]</li></ol>')}
          ${section('Revision History', '<table style="' + tableStyle + '"><tbody><tr><td style="' + labelCellStyle + '">Version</td><td style="' + labelCellStyle + '">Date</td><td style="' + labelCellStyle + '">Change</td></tr><tr><td style="' + valueCellStyle + '">1.0</td><td style="' + valueCellStyle + '">[Date]</td><td style="' + valueCellStyle + '">Initial draft</td></tr></tbody></table>')}
          ${signatureBlock(['Prepared By', 'Reviewed By', 'Approved By'])}
        </div>
      `,
      skillAcademy: `
        <div style="${pageBaseStyle}">
          ${coverHeader('Skill Academy Module', 'Training / Competency / Assessment Template')}
          ${metadataRows([
            ['Academy', '[Skill Academy Name]'],
            ['Program', '[Program Name]'],
            ['Module', '[Module Name]'],
            ['Duration', '[Hours / Weeks]'],
            ['Skill Level', '[Beginner / Intermediate / Advanced]'],
            ['Instructor', '[Instructor Name]'],
            ['Prerequisites', '[Prerequisites]'],
            ['Certification', '[Enabled / Not Enabled]'],
          ])}
          ${section('Module Outcomes', '<ul><li>[Outcome 1]</li><li>[Outcome 2]</li><li>[Outcome 3]</li></ul>')}
          ${section('Session Plan', '<table style="' + tableStyle + '"><tbody><tr><td style="' + labelCellStyle + '">Session</td><td style="' + labelCellStyle + '">Topic</td><td style="' + labelCellStyle + '">Activity</td></tr><tr><td style="' + valueCellStyle + '">1</td><td style="' + valueCellStyle + '">[Topic]</td><td style="' + valueCellStyle + '">[Activity]</td></tr></tbody></table>')}
          ${section('Assessment', '<p>[Describe practical test, quiz, project, or viva.]</p>')}
          ${signatureBlock(['Instructor', 'Coordinator', 'Learner'])}
        </div>
      `,
      bootcamp: `
        <div style="${pageBaseStyle}">
          ${coverHeader('Bootcamp Sprint Document', 'Project / Coding Challenge / Portfolio Template')}
          ${metadataRows([
            ['Bootcamp', '[Bootcamp Name]'],
            ['Track', '[MERN / AI-ML / Data Science / DevOps]'],
            ['Sprint / Week', '[Sprint / Week]'],
            ['Mentor', '[Mentor Name]'],
            ['Technology Stack', '[Tech Stack]'],
            ['Git Repository', '[Repository Link]'],
            ['Submission Deadline', '[Deadline]'],
            ['Evaluation Mode', '[Rubric / Demo / Code Review]'],
          ])}
          ${section('Problem Statement', '<p style="text-align:justify;">[Describe the challenge or project.]</p>')}
          ${section('Requirements', '<ul><li>[Functional requirement]</li><li>[Technical requirement]</li><li>[Submission requirement]</li></ul>')}
          ${section('Evaluation Rubric', '<table style="' + tableStyle + '"><tbody><tr><td style="' + labelCellStyle + '">Criteria</td><td style="' + labelCellStyle + '">Marks</td><td style="' + labelCellStyle + '">Remarks</td></tr><tr><td style="' + valueCellStyle + '">Code Quality</td><td style="' + valueCellStyle + '">[Marks]</td><td style="' + valueCellStyle + '">[Remarks]</td></tr></tbody></table>')}
          ${signatureBlock(['Learner', 'Mentor', 'Reviewer'])}
        </div>
      `,
      research: `
        <div style="${pageBaseStyle}">
          ${coverHeader('Research Paper', 'Journal / Conference / Seminar Template')}
          <h2 style="text-align:center;margin:0 0 18px;font-size:18px;">[Paper Title]</h2>
          <p style="text-align:center;margin:0 0 4px;"><strong>[Author Name(s)]</strong></p>
          <p style="text-align:center;margin:0 0 24px;color:#64748b;">[Affiliation] | [Corresponding Email]</p>
          ${section('Abstract', '<p style="text-align:justify;">[Write 150–250 word abstract.]</p>')}
          <p><strong>Keywords:</strong> [Keyword 1]; [Keyword 2]; [Keyword 3]</p>
          ${section('1. Introduction', '<p style="text-align:justify;">[Introduce the research problem.]</p>')}
          ${section('2. Methodology', '<p style="text-align:justify;">[Describe methods.]</p>')}
          ${section('3. Results and Discussion', '<p style="text-align:justify;">[Present results and discuss findings.]</p>')}
          ${section('4. Conclusion', '<p style="text-align:justify;">[Summarize conclusion.]</p>')}
          ${section('References', '<ol><li>[Reference]</li><li>[Reference]</li></ol>')}
        </div>
      `,
      publishing: `
        <div style="${pageBaseStyle}">
          ${coverHeader('Publishing Layout', 'Book / Chapter / Newsletter Template')}
          ${metadataRows([
            ['Book / Publication Title', '[Title]'],
            ['Chapter / Article', '[Chapter / Article Title]'],
            ['Author', '[Author Name]'],
            ['Publisher', '[Publisher]'],
            ['Edition', '[Edition]'],
            ['ISBN / ISSN', '[ISBN / ISSN]'],
            ['Copyright', '[Copyright Notice]'],
          ])}
          ${section('Preface / Introduction', '<p style="text-align:justify;">[Enter preface or introductory text.]</p>')}
          ${section('Main Content', '<p style="text-align:justify;">[Enter main content.]</p>')}
          ${section('Figure Caption Sample', '<p style="text-align:center;color:#475569;font-size:12px;"><strong>Figure 1.</strong> [Caption text]</p>')}
          ${section('Index / Notes', '<p>[Add index terms, notes, or acknowledgements.]</p>')}
        </div>
      `,
      certificate: `
        <div style="${pageBaseStyle}display:flex;flex-direction:column;justify-content:center;text-align:center;border:8px double #174f84;">
          <p style="margin:0 0 18px;font-size:16px;font-weight:800;color:#10ab7c;letter-spacing:.12em;text-transform:uppercase;">Certificate</p>
          <h1 style="margin:0 0 24px;font-size:34px;line-height:1.2;color:#174f84;">Certificate of Completion</h1>
          <p style="margin:0 0 10px;font-size:15px;color:#475569;">This is to certify that</p>
          <h2 style="margin:0 0 16px;font-size:30px;color:#111827;">[Learner Name]</h2>
          <p style="margin:0 auto 18px;max-width:560px;font-size:16px;">has successfully completed <strong>[Course / Program Name]</strong> conducted by <strong>[Institution / Organization]</strong>.</p>
          ${metadataRows([
            ['Certificate No.', '[Certificate Number]'],
            ['Duration', '[Duration]'],
            ['Completion Date', '[Date]'],
            ['Grade / Score', '[Grade / Score]'],
          ])}
          <div style="display:grid;grid-template-columns:1fr 110px 1fr;gap:24px;align-items:end;margin-top:58px;">
            <div style="${signatureLineStyle}">Instructor</div>
            <div style="height:90px;border:2px dashed #94a3b8;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:12px;font-weight:800;">QR / SEAL</div>
            <div style="${signatureLineStyle}">Authorized Signatory</div>
          </div>
        </div>
      `,
      report: `
        <div style="${pageBaseStyle}">
          ${coverHeader('Professional Report', 'Editable Report Theme')}
          ${metadataRows([
            ['Document Title', '[Report Title]'],
            ['Prepared For', '[Audience / Client / Institution]'],
            ['Prepared By', '[Name / Team]'],
            ['Date', '[Date]'],
            ['Version', '[Version]'],
          ])}
          ${section('Executive Summary', '<p style="text-align:justify;">[Write executive summary here.]</p>')}
          ${section('Objectives', '<ul><li>[Objective 1]</li><li>[Objective 2]</li></ul>')}
          ${section('Findings', '<p style="text-align:justify;">[Write key findings here.]</p>')}
          ${section('Recommendations', '<ol><li>[Recommendation 1]</li><li>[Recommendation 2]</li></ol>')}
          ${signatureBlock(['Prepared By', 'Reviewed By', 'Approved By'])}
        </div>
      `,
      minimal: `
        <div style="${pageBaseStyle}">
          <h1 style="margin:0 0 10px;font-size:30px;line-height:1.25;color:#111827;">Minimal Document Title</h1>
          <p style="margin:0 0 28px;color:#64748b;font-size:14px;">[Subtitle / Short description]</p>
          ${metadataRows([
            ['Owner', '[Name]'],
            ['Date', '[Date]'],
            ['Version', '[Version]'],
          ])}
          ${section('Overview', '<p style="text-align:justify;">[Write overview here.]</p>')}
          ${section('Details', '<p style="text-align:justify;">[Write details here.]</p>')}
          ${section('Next Steps', '<ul><li>[Next step 1]</li><li>[Next step 2]</li></ul>')}
        </div>
      `,
    };

    insertHtml(templates[theme]);
  }

  function applyLayoutColumns(nextColumnPreset: LayoutColumnPreset) {
    setColumnPreset(nextColumnPreset);
    setColumnCount(nextColumnPreset === '1' ? 1 : nextColumnPreset === '2' ? 2 : nextColumnPreset === '3' ? 3 : 2);
  }

  function applyPagePreset(preset: string) {
    if (preset === 'normal') {
      setPageViewMode('normal');
      setPageMargin('normal');
      setPageOrientation('portrait');
      setPageSize('A4');
      applyLayoutColumns('1');
      setZoomPercent(100);
      return;
    }

    if (preset === 'compact') {
      setPageViewMode('compact');
      setPageMargin('narrow');
      setPageOrientation('portrait');
      setPageSize('A4');
      applyLayoutColumns('1');
      setZoomPercent(90);
      return;
    }

    if (preset === 'landscape-two-column') {
      setPageViewMode('normal');
      setPageMargin('normal');
      setPageOrientation('landscape');
      setPageSize('A4');
      applyLayoutColumns('2');
      setZoomPercent(100);
    }
  }

  function insertLayoutBreak() {
    const choice = window.prompt(
      'Choose break type: page, column, section, continuous',
      'page'
    );

    if (choice === null) return;

    const normalizedChoice = choice.trim().toLowerCase();

    if (normalizedChoice === 'column') {
      insertHtml('<div data-layout-break="column" style="break-before:column;column-break-before:always;height:1px;margin:8px 0;border-top:1px dashed #94a3b8;color:#64748b;font-size:11px;">Column break</div><p></p>');
      return;
    }

    if (normalizedChoice === 'section' || normalizedChoice === 'section break') {
      insertHtml('<div data-layout-break="section" style="break-before:page;page-break-before:always;margin:18px 0;padding:8px 0;border-top:2px dashed #1d4ed8;color:#1d4ed8;font-size:11px;font-weight:700;text-align:center;">Section break - next page</div><p></p>');
      return;
    }

    if (normalizedChoice === 'continuous') {
      insertHtml('<div data-layout-break="continuous" style="margin:16px 0;padding:6px 0;border-top:1px dashed #10ab7c;color:#0e8f69;font-size:11px;font-weight:700;text-align:center;">Continuous section break</div><p></p>');
      return;
    }

    insertPageBreak();
  }

  function applyLayoutPosition() {
    const positionChoice = window.prompt(
      'Position selected image/object: left, center, right, free',
      'center'
    );

    if (positionChoice === null) return;

    const normalizedChoice = positionChoice.trim().toLowerCase();

    if (editor?.isActive('image')) {
      if (normalizedChoice === 'free') {
        enableSelectedImageFreePosition();
        return;
      }

      if (normalizedChoice === 'left' || normalizedChoice === 'center' || normalizedChoice === 'right') {
        applySelectedImageAlignment(normalizedChoice);
        return;
      }
    }

    if (normalizedChoice === 'left' || normalizedChoice === 'center' || normalizedChoice === 'right') {
      editor?.chain().focus().setTextAlign(normalizedChoice).run();
      notifyEditorChange();
    }
  }

  function applyLayoutWrapText() {
    const wrapChoice = window.prompt(
      'Wrap selected image/object: inline, left, right, behind, front',
      'inline'
    );

    if (wrapChoice === null) return;

    const normalizedChoice = wrapChoice.trim().toLowerCase();

    if (editor?.isActive('image')) {
      if (normalizedChoice === 'left') {
        applySelectedImageAlignment('float-left');
        return;
      }

      if (normalizedChoice === 'right') {
        applySelectedImageAlignment('float-right');
        return;
      }

      applySelectedImageAlignment('inline');
      return;
    }

    insertHtml(`<p data-layout-wrap="${escapeHtml(normalizedChoice)}" style="padding:8px 10px;border:1px dashed #94a3b8;border-radius:8px;color:#475569;">Wrap text: ${escapeHtml(normalizedChoice)}</p>`);
  }

  function toggleSelectionPane() {
    setSelectionPaneOpen((current) => !current);
  }

  function applyLayoutAlign() {
    const alignChoice = window.prompt(
      'Align selected text/object: left, center, right, justify',
      'left'
    );

    if (alignChoice === null) return;

    const normalizedChoice = alignChoice.trim().toLowerCase();

    if (editor?.isActive('image')) {
      if (normalizedChoice === 'center' || normalizedChoice === 'right' || normalizedChoice === 'left') {
        applySelectedImageAlignment(normalizedChoice);
      }
      return;
    }

    if (normalizedChoice === 'left' || normalizedChoice === 'center' || normalizedChoice === 'right' || normalizedChoice === 'justify') {
      editor?.chain().focus().setTextAlign(normalizedChoice).run();
      notifyEditorChange();
    }
  }

  function applyLayoutGroup() {
    const groupName = window.prompt('Group name:', 'Grouped Object');
    if (groupName === null) return;

    const selectedHtml = editor?.state.selection.empty ? '' : editor?.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ');

    insertHtml(`
      <div data-layout-group="true" style="margin:14px 0;padding:12px;border:1px dashed #0e8f69;border-radius:12px;background:#f8fafc;">
        <strong style="display:block;margin-bottom:6px;color:#0e8f69;">${escapeHtml(groupName.trim() || 'Grouped Object')}</strong>
        <p style="margin:0;color:#475569;">${escapeHtml(selectedHtml || 'Grouped content placeholder')}</p>
      </div>
    `);
  }

  function applyLayoutRotate() {
    const rotateChoice = window.prompt('Rotate selected object: 90, -90, 180, flip-horizontal, flip-vertical', '90');
    if (rotateChoice === null) return;

    const normalizedChoice = rotateChoice.trim().toLowerCase();

    if (editor?.isActive('image')) {
      const rotationStyle =
        normalizedChoice === '-90'
          ? 'rotate(-90deg)'
          : normalizedChoice === '180'
            ? 'rotate(180deg)'
            : normalizedChoice === 'flip-horizontal'
              ? 'scaleX(-1)'
              : normalizedChoice === 'flip-vertical'
                ? 'scaleY(-1)'
                : 'rotate(90deg)';

      updateSelectedImageAttributes({
        title: `layout-transform:${rotationStyle}`,
      });
      notifyEditorChange();
      return;
    }

    insertHtml(`<span data-layout-rotate="${escapeHtml(normalizedChoice)}" style="display:inline-block;transform:rotate(${normalizedChoice === '-90' ? '-90' : normalizedChoice === '180' ? '180' : '90'}deg);">Rotated text</span>`);
  }

  function applyAiResult(
    action: AiEditorAction,
    result: AppTextEditorValue | string
  ) {
    if (!editor) return;

    const shouldReplace =
      action === 'improve' ||
      action === 'translate' ||
      action === 'summarize';

    const nextHtml =
      typeof result === 'string'
        ? markdownLikeTextToHtml(result)
        : result.html || markdownLikeTextToHtml(result.plain_text || '');

    if (shouldReplace) {
      (editor.commands as any).setContent(nextHtml, true);
    } else {
      editor.chain().focus().insertContent(nextHtml).run();
    }

    notifyEditorChange();
  }

  async function runAiAction(action: AiEditorAction) {
    if (!editor) return;

    setIsAiRunning(true);

    try {
      const activeValue = getLatestValue();

      if (onAiAction) {
        const res = await onAiAction(action, activeValue);

        if (res) {
          applyAiResult(action, res);
        }

        return;
      }

      try {
        const response = await fetch(aiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            value: activeValue,
            context: aiContext,
            targetLanguage,
          }),
        });

        if (response.ok) {
          const responseData = await response.json();

          const result =
            responseData.value ||
            responseData.result ||
            responseData.text ||
            responseData.html ||
            responseData;

          if (typeof result === 'string') {
            applyAiResult(action, result);
            return;
          }

          if (result?.html || result?.plain_text) {
            applyAiResult(action, result);
            return;
          }
        }
      } catch {
        // Fallback below.
      }

      const fallbackDraft = buildOfflineAcademicAiDraft(
        action,
        aiContext,
        activeValue.plain_text,
        targetLanguage
      );

      applyAiResult(action, fallbackDraft);
    } catch (err) {
      console.error('AI execution issue:', err);
    } finally {
      setIsAiRunning(false);
    }
  }

  function createManualSnapshot() {
    const activeValue = getLatestValue();

    const snapshot: EditorVersion = {
      id: Math.random().toString(36).substring(2, 9),
      title: `Snapshot #${versions.length + 1} (${editorStats.words} words)`,
      value: activeValue,
      created_at: new Date().toISOString(),
    };

    const nextVersions = [snapshot, ...versions];

    setVersions(nextVersions);

    if (storageKey) {
      window.localStorage.setItem(`${storageKey}_versions`, JSON.stringify(nextVersions));
    }
  }

  function restoreSnapshot(v: EditorVersion) {
    if (!editor) return;

    const confirmRestore = window.confirm(
      `Restore to snapshot: "${v.title}"? Current text will be overwritten.`
    );

    if (!confirmRestore) return;

    const nextHtml = getInitialHtml(v.value);

    (editor.commands as any).setContent(nextHtml, { emitUpdate: false });

    setCurrentValue({
      html: editor.getHTML(),
      plain_text: getEditorPlainText(editor),
      json_content: editor.getJSON(),
    });
  }

  function handleAddComment() {
    if (!commentText.trim()) return;

    const c: EditorComment = {
      id: Math.random().toString(36).substring(2, 9),
      text: commentText.trim(),
      created_at: new Date().toISOString(),
    };

    const nextComments = [c, ...comments];

    setComments(nextComments);
    setCommentText('');

    if (storageKey) {
      window.localStorage.setItem(`${storageKey}_comments`, JSON.stringify(nextComments));
    }
  }

  function injectUniversityTag(type: 'co' | 'skill', tagCode: string) {
    if (!editor) return;

    const selection = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(selection.from, selection.to, ' ');
    const fallbackText = tagCode;
    const wrapperText = selectedText || fallbackText;
    const injectedMarkup = `<strong>${tagCode}:</strong> ${wrapperText}`;

    editor.chain().focus().insertContent(injectedMarkup).run();
  }

  function insertAcademicTemplate(type: AcademicTemplateType) {
    if (!editor) return;

    const context = getSyllabusEditorContext();
    const selectedSyllabusStructure = getSyllabusStructureFromAcademicTemplate(
      type
    );

    const templateHtml = selectedSyllabusStructure
      ? buildSyllabusDraftTableTemplate(
          selectedSyllabusStructure,
          aiContext,
          context.syllabusTitle,
          context.syllabusVersion
        )
      : buildAcademicTemplate(type, aiContext, courseOutcomes);

    editor.chain().focus().insertContent(templateHtml).run();
    notifyEditorChange();
  }

  function handleAcademicTemplateSelect(value: string) {
    if (!value) return;
    insertAcademicTemplate(value as AcademicTemplateType);
  }

  function copyPlainText() {
    const activeValue = getLatestValue();

    navigator.clipboard
      ?.writeText(activeValue.plain_text)
      .catch(() => {
        window.alert('Copy failed. Select the text manually and copy.');
      });
  }

  function copyHtml() {
    const activeValue = getLatestValue();

    navigator.clipboard
      ?.writeText(activeValue.html)
      .catch(() => {
        window.alert('Copy failed. Select the HTML manually and copy.');
      });
  }

  function shareDocument() {
    const activeValue = getLatestValue();

    if (navigator.share) {
      navigator.share({
        title: label || 'Document',
        text: activeValue.plain_text || '',
      }).catch(() => undefined);
      return;
    }

    copyPlainText();
    window.alert('Document text copied. Native share is not available in this browser.');
  }

  function buildExportHtml(documentTitle = label || 'Document') {
    const activeValue = getLatestValue();
    const pagedBodyHtml = buildPagedDocumentHtml(activeValue.html || '<p></p>', {
      mode: 'export',
      emptyMessage: '<p></p>',
    });

    const pageWidth =
      pageSize === 'Legal'
        ? pageOrientation === 'portrait'
          ? '8.5in'
          : '14in'
        : pageSize === 'Letter'
          ? pageOrientation === 'portrait'
            ? '8.5in'
            : '11in'
          : pageOrientation === 'portrait'
            ? '210mm'
            : '297mm';

    const pageHeight =
      pageSize === 'Legal'
        ? pageOrientation === 'portrait'
          ? '14in'
          : '8.5in'
        : pageSize === 'Letter'
          ? pageOrientation === 'portrait'
            ? '11in'
            : '8.5in'
          : pageOrientation === 'portrait'
            ? '297mm'
            : '210mm';

    const printMargin =
      pageMargin === 'narrow'
        ? '10mm'
        : pageMargin === 'wide'
          ? '28mm'
          : pageMargin === 'mirrored'
            ? '20mm 25mm 20mm 15mm'
            : pageMargin === 'custom'
              ? '18mm 24mm'
              : '20mm';

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${escapeHtml(documentTitle)}</title>
          <style>
            @page {
              size: ${pageWidth} ${pageHeight};
              margin: ${printMargin};
            }

            body {
              margin: 0;
              padding: 0;
              color: #111827;
              background: #ffffff;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 14px;
              line-height: 1.6;
              column-count: ${columnCount};
              column-gap: ${columnCount > 1 ? '32px' : 'normal'};
              hyphens: ${hyphenation ? 'auto' : 'manual'};
              overflow-wrap: anywhere;
              word-break: break-word;
            }

            *, *::before, *::after {
              box-sizing: border-box;
              max-width: 100%;
            }

            p, div, span, main, section, article, header, footer, blockquote, li, td, th {
              overflow-wrap: anywhere;
              word-break: break-word;
              white-space: normal;
            }

            h1, h2, h3, h4 {
              color: #1f2a44;
              line-height: 1.25;
            }

            table {
              width: 100%;
              max-width: 100%;
              table-layout: fixed;
              border-collapse: collapse;
              margin: 16px 0;
            }

            th, td {
              border: 1px solid #d1d5db;
              padding: 8px 10px;
              vertical-align: top;
            }

            th {
              background: #f3f4f6;
              font-weight: 700;
            }

            img {
              max-width: 100%;
              height: auto;
            }

            blockquote {
              border-left: 4px solid #0e8f69;
              margin: 16px 0;
              padding: 8px 14px;
              background: #f8fafc;
            }

            [data-document-utility-type="page-break"],
            [data-document-utility-type="page-break-body-start"],
            [data-document-utility-type="cover-page-body-start"],
            [data-document-utility-type="blank-page"],
            [data-document-utility-type="blank-page-body-start"],
            [data-document-utility-type="page-number"] {
              display: none !important;
            }

            [data-document-preview-page] {
              break-after: page;
              page-break-after: always;
            }

            [data-document-preview-page]:last-child {
              break-after: auto;
              page-break-after: auto;
            }
          </style>
        </head>
        <body>
          ${pagedBodyHtml}
        </body>
      </html>
    `;
  }

  function downloadWordDocument() {
    const fullHtml = buildExportHtml(label || 'Document');

    const blob = new Blob([fullHtml], {
      type: 'application/msword;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `${label || 'academic-document'}.doc`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function printContentOnly() {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');

    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildExportHtml(label || 'Document'));
    printWindow.document.close();

    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  function exportPdfDocument() {
    const activeValue = getLatestValue();

    if (onExportPdf) {
      onExportPdf({
        ...activeValue,
        html: buildPagedDocumentHtml(activeValue.html || '<p></p>', {
          mode: 'export',
          emptyMessage: '<p></p>',
        }),
      });
      return;
    }

    printContentOnly();
  }

  function insertPageBreak() {
    const pageBreakNumber = getNextDocumentUtilityNumber('page-break');

    insertDocumentContent([
      createPageBreakParagraph(
        createSmallEditorMarkerText(`Page break inserted (page ${pageBreakNumber + 1})`),
        '#1d4ed8'
      ),
      createEditableEmptyParagraph(),
    ]);
  }

  function insertDateTime() {
    const now = new Date();
    const dateTimeLabel = now.toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    insertDocumentContent(
      createDocumentUtilityParagraph(
        'date-time',
        dateTimeLabel,
        'margin: 10px 0; color: #334155; font-size: 13px; font-weight: 600'
      )
    );
  }

  function getSignaturePromptConfig(
    templateType: SignatureLineTemplateType
  ): SignaturePromptConfig {
    if (templateType === 'basicSignature') {
      return {
        templateType,
        title: 'Basic Signature',
        description: 'Enter the label that should appear above the signature line.',
        fields: [
          {
            key: 'signatureLabel',
            label: 'Signature label',
            defaultValue: 'Signature',
            placeholder: 'Signature',
          },
        ],
      };
    }

    if (templateType === 'approvalSignature') {
      return {
        templateType,
        title: 'Prepared / Reviewed / Approved',
        description: 'Enter the approval names for the three signature columns.',
        fields: [
          {
            key: 'preparedBy',
            label: 'Prepared by',
            defaultValue: 'Prepared by',
            placeholder: 'Prepared by',
          },
          {
            key: 'reviewedBy',
            label: 'Reviewed by',
            defaultValue: 'Reviewed by',
            placeholder: 'Reviewed by',
          },
          {
            key: 'approvedBy',
            label: 'Approved by',
            defaultValue: 'Approved by',
            placeholder: 'Approved by',
          },
        ],
      };
    }

    if (templateType === 'facultyApprovalSignature') {
      return {
        templateType,
        title: 'Faculty / Coordinator / HOD',
        description: 'Enter the course-management approval names.',
        fields: [
          {
            key: 'facultyName',
            label: 'Faculty name',
            defaultValue: 'Faculty',
            placeholder: 'Faculty',
          },
          {
            key: 'coordinatorName',
            label: 'Coordinator name',
            defaultValue: 'Coordinator',
            placeholder: 'Coordinator',
          },
          {
            key: 'hodName',
            label: 'HOD / approver name',
            defaultValue: 'HOD',
            placeholder: 'HOD',
          },
        ],
      };
    }

    if (templateType === 'digitalSignature') {
      return {
        templateType,
        title: 'Digital Signature',
        description: 'Enter the signer details for the digital signature block.',
        fields: [
          {
            key: 'signerName',
            label: 'Digital signer name',
            defaultValue: 'Name',
            placeholder: 'Name',
          },
          {
            key: 'signerEmail',
            label: 'Signer email',
            defaultValue: 'name@company.com',
            placeholder: 'name@company.com',
          },
        ],
      };
    }

    if (templateType === 'initialsSignature') {
      return {
        templateType,
        title: 'Initials / Short Approval',
        description: 'Enter the label that should appear before the initials line.',
        fields: [
          {
            key: 'initialsLabel',
            label: 'Initials label',
            defaultValue: 'Initials',
            placeholder: 'Initials',
          },
        ],
      };
    }

    return {
      templateType,
      title: 'Name + Date Signature',
      description: 'Enter the signer name and designation for the signature table.',
      fields: [
        {
          key: 'signerName',
          label: 'Signer name',
          defaultValue: 'Name',
          placeholder: 'Name',
        },
        {
          key: 'signerRole',
          label: 'Signer designation / role',
          defaultValue: 'Designation',
          placeholder: 'Designation',
        },
      ],
    };
  }

  function openSignaturePrompt(
    templateType: SignatureLineTemplateType = 'nameDateSignature'
  ) {
    if (editor) {
      signatureInsertPositionRef.current = editor.state.selection.from;
    }

    const promptConfig = getSignaturePromptConfig(templateType);
    const initialValues = promptConfig.fields.reduce<Record<string, string>>(
      (values, field) => {
        values[field.key] = field.defaultValue;
        return values;
      },
      {}
    );

    setSignaturePromptConfig(promptConfig);
    setSignaturePromptValues(initialValues);
  }

  function closeSignaturePrompt() {
    setSignaturePromptConfig(null);
    setSignaturePromptValues({});
  }

  function handleSignaturePromptChange(key: string, value: string) {
    setSignaturePromptValues((previousValues) => ({
      ...previousValues,
      [key]: value,
    }));
  }

  function confirmSignaturePrompt() {
    if (!signaturePromptConfig) return;

    const nextSignatureTemplateType = signaturePromptConfig.templateType;
    const nextSignaturePromptValues = { ...signaturePromptValues };

    closeSignaturePrompt();

    window.setTimeout(() => {
      insertSignatureBlockFromValues(
        nextSignatureTemplateType,
        nextSignaturePromptValues
      );
    }, 0);
  }

  function handleSignatureTemplateSelect(value: string) {
    if (!value) return;
    openSignaturePrompt(value as SignatureLineTemplateType);
  }

  function insertSignatureBlock(
    templateType: SignatureLineTemplateType = 'nameDateSignature'
  ) {
    openSignaturePrompt(templateType);
  }

  function insertSignatureBlockFromValues(
    templateType: SignatureLineTemplateType,
    promptValues: Record<string, string>
  ) {
    if (!editor) return;

    const currentDate = getTodayLabel();

    const normalizeSignatureValue = (value: string | undefined, fallback: string) => {
      const trimmedValue = (value || '').trim();
      return trimmedValue || fallback;
    };

    const signatureParagraph = (
      text: string,
      style = 'margin:0 0 4px; color:#111827; font-size:12.5px; line-height:18px; text-align:center;'
    ) => createDocumentUtilityParagraph('signature-line', text, style);

    const signatureSpacer = () =>
      createDocumentUtilityParagraph(
        'signature-line',
        '',
        'margin:16px 0 0; height:1px; line-height:1px;'
      );

    const signatureLine = (width = 34) => '_'.repeat(width);

    const makeSingleSignatureBlock = (
      label: string,
      name: string,
      designation = '',
      dateLabel = `Date: ${signatureLine(18)}`,
      meta = ''
    ) => {
      const content: any[] = [
        signatureSpacer(),
        signatureParagraph(
          signatureLine(34),
          'margin:0 0 6px; color:#111827; font-size:13px; line-height:18px; letter-spacing:0.8px; text-align:center;'
        ),
        signatureParagraph(
          label,
          'margin:0 0 2px; color:#111827; font-size:12.5px; font-weight:700; line-height:18px; text-align:center;'
        ),
        signatureParagraph(name),
      ];

      if (designation) {
        content.push(
          signatureParagraph(
            designation,
            'margin:0 0 2px; color:#334155; font-size:12px; line-height:17px; text-align:center;'
          )
        );
      }

      if (meta) {
        content.push(
          signatureParagraph(
            meta,
            'margin:0 0 2px; color:#475569; font-size:11.5px; line-height:16px; text-align:center;'
          )
        );
      }

      content.push(
        signatureParagraph(
          dateLabel,
          'margin:6px 0 0; color:#334155; font-size:12px; line-height:17px; text-align:center;'
        )
      );

      return content;
    };

    const signatureMultilineParagraph = (
      lines: string[],
      style = 'margin:16px auto 8px; color:#111827; font-family:"Courier New", Courier, monospace; font-size:12px; line-height:20px; text-align:center; white-space:pre;'
    ) => {
      const paragraph: Record<string, unknown> = {
        type: 'paragraph',
        attrs: {
          documentUtilityType: 'signature-line',
          documentUtilityStyle: style,
        },
        content: [],
      };

      const content = paragraph.content as any[];
      lines.forEach((line, index) => {
        if (index > 0) {
          content.push({ type: 'hardBreak' });
        }
        if (line) {
          content.push({ type: 'text', text: line });
        }
      });

      return paragraph;
    };

    const makeApprovalRow = (items: { label: string; name: string }[]) => {
      const normalizedItems = items.map((item) => ({
        label: normalizeSignatureValue(item.label, 'Signature'),
        name: normalizeSignatureValue(item.name, 'Name'),
      }));

      const columnWidth = 30;
      const columnGap = '\u00a0'.repeat(12);
      const lineText = '_'.repeat(24);

      const normalizePlainText = (value: string) =>
        value.replace(/\s+/g, ' ').trim();

      const fitSignatureCell = (value: string) => {
        const normalizedValue = normalizePlainText(value);
        if (normalizedValue.length > columnWidth) {
          return normalizedValue.slice(0, columnWidth);
        }
        return normalizedValue;
      };

      const centerSignatureCell = (value: string) => {
        const fittedValue = fitSignatureCell(value);
        const remainingSpace = Math.max(columnWidth - fittedValue.length, 0);
        const leftSpace = Math.floor(remainingSpace / 2);
        const rightSpace = remainingSpace - leftSpace;
        return `${'\u00a0'.repeat(leftSpace)}${fittedValue}${'\u00a0'.repeat(rightSpace)}`;
      };

      const makeSignatureRow = (values: string[]) =>
        values.map(centerSignatureCell).join(columnGap);

      const signatureLines = [
        makeSignatureRow(normalizedItems.map(() => lineText)),
        makeSignatureRow(normalizedItems.map((item) => item.label)),
        makeSignatureRow(normalizedItems.map((item) => item.name)),
        makeSignatureRow(normalizedItems.map(() => `Date: ${signatureLine(12)}`)),
      ];

      return [
        signatureSpacer(),
        signatureMultilineParagraph(
          signatureLines,
          'margin:28px auto 12px; color:#111827; font-family:"Courier New", Courier, monospace; font-size:12px; line-height:22px; text-align:center; white-space:pre; background:transparent; border:0; box-shadow:none; padding:0;'
        ),
        signatureSpacer(),
      ];
    };

    let signatureContent: any[] = [];

    if (templateType === 'basicSignature') {
      const signatureLabel = normalizeSignatureValue(promptValues.signatureLabel, 'Signature');
      signatureContent = makeSingleSignatureBlock(
        signatureLabel,
        'Name',
        '',
        `Date: ${signatureLine(18)}`
      );
    } else if (templateType === 'nameDateSignature') {
      const signerName = normalizeSignatureValue(promptValues.signerName, 'Name');
      const signerRole = normalizeSignatureValue(promptValues.signerRole, 'Designation');
      signatureContent = makeSingleSignatureBlock(
        'Signature',
        signerName,
        signerRole,
        `Date: ${signatureLine(18)}`
      );
    } else if (templateType === 'approvalSignature') {
      signatureContent = makeApprovalRow([
        {
          label: 'Prepared By',
          name: normalizeSignatureValue(promptValues.preparedBy, 'Prepared by'),
        },
        {
          label: 'Reviewed By',
          name: normalizeSignatureValue(promptValues.reviewedBy, 'Reviewed by'),
        },
        {
          label: 'Approved By',
          name: normalizeSignatureValue(promptValues.approvedBy, 'Approved by'),
        },
      ]);
    } else if (templateType === 'facultyApprovalSignature') {
      signatureContent = makeApprovalRow([
        {
          label: 'Faculty',
          name: normalizeSignatureValue(promptValues.facultyName, 'Faculty'),
        },
        {
          label: 'Coordinator',
          name: normalizeSignatureValue(promptValues.coordinatorName, 'Coordinator'),
        },
        {
          label: 'HOD / Approver',
          name: normalizeSignatureValue(promptValues.hodName, 'HOD'),
        },
      ]);
    } else if (templateType === 'digitalSignature') {
      const signerName = normalizeSignatureValue(promptValues.signerName, 'Name');
      const signerEmail = normalizeSignatureValue(promptValues.signerEmail, 'name@company.com');
      const signedAt = new Date().toLocaleString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      signatureContent = makeSingleSignatureBlock(
        'Digitally Signed By',
        signerName,
        signerEmail,
        `Date: ${currentDate}`,
        `Verified: ${signedAt}`
      );
    } else if (templateType === 'initialsSignature') {
      const initialsLabel = normalizeSignatureValue(promptValues.initialsLabel, 'Initials');
      signatureContent = makeSingleSignatureBlock(
        initialsLabel,
        'Initials',
        '',
        `Date: ${signatureLine(18)}`
      );
    }

    if (!signatureContent.length) return;

    const insertPosition = signatureInsertPositionRef.current;
    const documentSize = editor.state.doc.content.size;
    const safeInsertPosition =
      typeof insertPosition === 'number'
        ? Math.max(1, Math.min(insertPosition, documentSize))
        : null;

    const chain = editor.chain().focus();

    if (safeInsertPosition !== null) {
      chain.setTextSelection(safeInsertPosition);
    }

    chain
      .insertContent([...signatureContent, { type: 'paragraph' }])
      .run();

    signatureInsertPositionRef.current = null;

    window.requestAnimationFrame(() => {
      notifyEditorChange();
      editor.commands.focus();
    });
  }

  function findAndReplaceText() {
    if (!editor || !findText.trim()) return;

    const activeValue = getLatestValue();

    const nextPlainText = activeValue.plain_text.replaceAll(
      findText,
      replaceText
    );

    const nextHtml = markdownLikeTextToHtml(nextPlainText);

    (editor.commands as any).setContent(nextHtml, true);

    setFindText('');
    setReplaceText('');
    notifyEditorChange();
  }

  const RibbonGroup = useCallback(
    function RibbonGroup({
      title,
      tab,
      className = '',
      children,
    }: {
      title: string;
      tab: RibbonTab;
      className?: string;
      children: ReactNode;
    }) {
      if (activeRibbonTab !== tab) return null;

      return (
        <section className={`${styles.toolbarRow} ${className}`}>
          <div className={styles.toolbarContent}>
            {children}
          </div>

          <div className={styles.toolbarLabel}>
            {title}
          </div>
        </section>
      );
    },
    [activeRibbonTab]
  );


  function renderHomeDropdown({
    dropdownType,
    triggerLabel,
    ariaLabel,
    options,
    selectedValue,
    onSelect,
    rootClassName = '',
    menuClassName = '',
    showDescriptions = false,
    editable = false,
    inputValue = '',
    placeholder,
    inputMode,
    onInputChange,
    onInputCommit,
  }: {
    dropdownType: HomeDropdownKey;
    triggerLabel: string;
    ariaLabel: string;
    options: HomeDropdownOption[];
    selectedValue?: string;
    onSelect: (option: HomeDropdownOption) => void;
    rootClassName?: string;
    menuClassName?: string;
    showDescriptions?: boolean;
    editable?: boolean;
    inputValue?: string;
    placeholder?: string;
    inputMode?: 'text' | 'decimal' | 'numeric' | 'search';
    onInputChange?: (value: string) => void;
    onInputCommit?: (value: string) => void;
  }) {
    const isOpen = openHomeDropdown === dropdownType;
    const normalizedInputValue = editable ? inputValue.trim().toLowerCase() : '';
    const visibleOptions =
      editable && normalizedInputValue
        ? options.filter((option) => {
            return (
              option.label.toLowerCase().includes(normalizedInputValue) ||
              option.value.toLowerCase().includes(normalizedInputValue)
            );
          })
        : options;

    const canRenderPortalMenu =
      isOpen &&
      homeDropdownPosition &&
      typeof document !== 'undefined';

    const openDropdown = () => {
      updateHomeDropdownPosition(dropdownType);
      setOpenHomeDropdown(dropdownType);

      window.requestAnimationFrame(() => {
        updateHomeDropdownPosition(dropdownType);
      });
    };

    const closeDropdown = () => {
      setOpenHomeDropdown(null);
      setHomeDropdownPosition(null);
    };

    const commitEditableInput = () => {
      if (!editable || !onInputCommit) return;
      onInputCommit(inputValue);
    };

    const dropdownMenu = canRenderPortalMenu
      ? createPortal(
          <div
            className={`homeNeoDropdownMenu homeNeoDropdownMenuPortal ${menuClassName}`}
            role="listbox"
            aria-label={ariaLabel}
            data-home-dropdown-menu="true"
            data-home-dropdown-kind={dropdownType}
            style={{
              top: homeDropdownPosition.top,
              left: homeDropdownPosition.left,
              width: homeDropdownPosition.width,
              maxHeight: homeDropdownPosition.maxHeight,
            }}
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onTouchMove={(event) => event.stopPropagation()}
            onWheel={(event) => {
              event.stopPropagation();

              const menuElement = event.currentTarget;
              const canScroll = menuElement.scrollHeight > menuElement.clientHeight;

              if (!canScroll) return;

              event.preventDefault();
              menuElement.scrollTop += event.deltaY;
            }}
          >
            {visibleOptions.length === 0 ? (
              <div className="homeNeoDropdownEmpty">
                No matching options. Press Enter to apply the typed value.
              </div>
            ) : (
              visibleOptions.map((option) => {
                const isActive =
                  selectedValue === option.value || selectedValue === option.label;

                return (
                  <button
                    key={`${dropdownType}-${option.value}`}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={`homeNeoDropdownOption ${
                      isActive ? 'homeNeoDropdownOptionActive' : ''
                    } ${option.marker || option.color ? '' : 'homeNeoDropdownOptionNoMarker'}`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(option);
                      closeDropdown();
                    }}
                  >
                    {option.color ? (
                      <span
                        className="homeNeoDropdownColorSwatch"
                        style={{ backgroundColor: option.color }}
                        aria-hidden="true"
                      />
                    ) : option.marker ? (
                      <span className="homeNeoDropdownMarker">{option.marker}</span>
                    ) : null}

                    <span className="homeNeoDropdownText">
                      <span className="homeNeoDropdownLabel">{option.label}</span>
                      {showDescriptions && option.description && (
                        <span className="homeNeoDropdownDescription">
                          {option.description}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>,
          document.body
        )
      : null;

    if (editable) {
      return (
        <div
          className={`homeNeoDropdown homeNeoEditableDropdown ${rootClassName}`}
          data-home-dropdown-root="true"
          data-home-dropdown-kind={dropdownType}
          data-manual-entry-root="true"
        >
          <input
            ref={(node) => {
              homeDropdownTriggerRefs.current[dropdownType] = node;
            }}
            type="text"
            inputMode={inputMode || 'text'}
            className="homeNeoEditableDropdownInput"
            value={inputValue}
            placeholder={placeholder || triggerLabel}
            aria-label={ariaLabel}
            autoComplete="off"
            spellCheck={false}
            data-manual-entry-input="true"
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              openDropdown();
            }}
            onFocus={(event) => {
              event.stopPropagation();
              openDropdown();
            }}
            onChange={(event) => {
              event.stopPropagation();
              onInputChange?.(event.target.value);

              if (!isOpen) {
                openDropdown();
              } else {
                window.requestAnimationFrame(() => updateHomeDropdownPosition(dropdownType));
              }
            }}
            onKeyDown={(event) => {
              event.stopPropagation();

              if (event.key === 'Enter') {
                event.preventDefault();
                commitEditableInput();
                closeDropdown();
              }

              if (event.key === 'Escape') {
                event.preventDefault();
                closeDropdown();
              }

              if (event.key === 'ArrowDown') {
                event.preventDefault();
                openDropdown();
              }
            }}
            onInput={(event) => event.stopPropagation()}
            onBlur={() => {
              window.setTimeout(() => {
                commitEditableInput();
              }, 0);
            }}
          />

          <button
            type="button"
            className="homeNeoEditableDropdownToggle"
            aria-label={`Open ${ariaLabel} options`}
            tabIndex={-1}
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.stopPropagation();

              if (isOpen) {
                closeDropdown();
                return;
              }

              openDropdown();
            }}
          >
            ▾
          </button>

          {dropdownMenu}
        </div>
      );
    }

    return (
      <div
        className={`homeNeoDropdown ${rootClassName}`}
        data-home-dropdown-root="true"
        data-home-dropdown-kind={dropdownType}
      >
        <button
          type="button"
          ref={(node) => {
            homeDropdownTriggerRefs.current[dropdownType] = node;
          }}
          className="homeNeoDropdownTrigger"
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();

            if (isOpen) {
              closeDropdown();
              return;
            }

            openDropdown();
          }}
        >
          <span className="homeNeoDropdownValue">{triggerLabel}</span>
          <span className="homeNeoDropdownCaret" aria-hidden="true">▾</span>
        </button>

        {dropdownMenu}
      </div>
    );
  }

  function renderChartChoiceIcon(type: EditableChartType, isLarge = false) {
    const className = `${styles.insertChooserChartIcon} ${isLarge ? styles.insertChooserChartIconLarge : ''}`;

    if (type === 'pie' || type === 'doughnut' || type === 'sunburst') {
      return (
        <span className={`${className} ${styles.insertChooserPieIcon}`}>
          <i />
        </span>
      );
    }

    if (type === 'line' || type === 'area' || type === 'combo' || type === 'stock') {
      return (
        <span className={`${className} ${styles.insertChooserLineIcon}`}>
          <i />
          <i />
          <i />
        </span>
      );
    }

    if (type === 'bar' || type === 'funnel' || type === 'waterfall') {
      return (
        <span className={`${className} ${styles.insertChooserBarIcon}`}>
          <i />
          <i />
          <i />
        </span>
      );
    }

    if (type === 'scatter' || type === 'radar') {
      return (
        <span className={`${className} ${styles.insertChooserScatterIcon}`}>
          <i />
          <i />
          <i />
          <i />
        </span>
      );
    }

    return (
      <span className={`${className} ${styles.insertChooserColumnIcon}`}>
        <i />
        <i />
        <i />
      </span>
    );
  }

  function renderSmartArtChoiceIcon(type: SmartArtTemplateType, isLarge = false) {
    const className = `${styles.insertChooserSmartArtIcon} ${isLarge ? styles.insertChooserSmartArtIconLarge : ''}`;

    if (type === 'process' || type === 'chevronProcess') {
      return (
        <span className={`${className} ${styles.insertChooserProcessIcon}`}>
          <i />
          <i />
          <i />
        </span>
      );
    }

    if (type === 'cycle') {
      return (
        <span className={`${className} ${styles.insertChooserCycleIcon}`}>
          <i />
          <i />
          <i />
          <i />
        </span>
      );
    }

    if (type === 'hierarchy') {
      return (
        <span className={`${className} ${styles.insertChooserHierarchyIcon}`}>
          <i />
          <i />
          <i />
          <i />
        </span>
      );
    }

    if (type === 'matrix') {
      return (
        <span className={`${className} ${styles.insertChooserMatrixIcon}`}>
          <i />
          <i />
          <i />
          <i />
        </span>
      );
    }

    if (type === 'pyramid') {
      return (
        <span className={`${className} ${styles.insertChooserPyramidIcon}`}>
          <i />
          <i />
          <i />
        </span>
      );
    }

    return (
      <span className={`${className} ${styles.insertChooserListIcon}`}>
        <i />
        <i />
        <i />
      </span>
    );
  }

  function renderEquationDialog() {
    if (typeof document === 'undefined') return null;

    const isEditing = equationDialogMode === 'edit';

    return createPortal(
      <div
        className={styles.insertChooserOverlay}
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? 'Edit equation' : 'Insert equation'}
      >
        <div className={styles.equationDialogShell}>
          <div className={styles.insertChooserHeader}>
            <span>{isEditing ? 'Edit Equation' : 'Insert Equation'}</span>
            <button
              type="button"
              onClick={closeEquationDialog}
              aria-label="Close equation dialog"
            >
              ×
            </button>
          </div>

          <div className={styles.equationDialogBody}>
            <label className={styles.equationField}>
              
              <textarea
                ref={equationTextareaRef}
                value={equationLatex}
                onChange={(event) => setEquationLatex(event.target.value)}
                placeholder="a^2 - b^2 = (a - b)(a + b)"
                className={styles.equationTextarea}
                autoFocus
              />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(38px, 1fr))',
                  gap: '6px',
                  marginTop: '10px',
                  maxHeight: '210px',
                  overflowY: 'auto',
                  padding: '8px',
                  borderRadius: '12px',
                  background: '#dfe6e9',
                  boxShadow: 'inset 3px 3px 6px rgba(185, 195, 201, 0.84), inset -3px -3px 6px rgba(255, 255, 255, 0.92)',
                }}
                aria-label="Mathematical symbols"
              >
                {equationSymbolOptions.map((symbol, symbolIndex) => (
                  <button
                    key={`${symbol}-${symbolIndex}`}
                    type="button"
                    onClick={() => insertEquationSymbol(symbol)}
                    style={{
                      minWidth: '38px',
                      minHeight: '34px',
                      border: 0,
                      borderRadius: '10px',
                      background: '#dfe6e9',
                      color: '#111827',
                      fontFamily: 'Cambria Math, Cambria, Times New Roman, serif',
                      fontSize: '16px',
                      fontWeight: 800,
                      lineHeight: '20px',
                      cursor: 'pointer',
                      boxShadow: '3px 3px 6px rgba(185, 195, 201, 0.76), -3px -3px 6px rgba(255, 255, 255, 0.96)',
                    }}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </label>

            <div className={styles.equationModeRow} role="group" aria-label="Equation display mode">
              <button
                type="button"
                className={
                  equationDisplayMode === 'block'
                    ? styles.equationModeButtonActive
                    : styles.equationModeButton
                }
                onClick={() => setEquationDisplayMode('block')}
              >
                Block
              </button>
              <button
                type="button"
                className={
                  equationDisplayMode === 'inline'
                    ? styles.equationModeButtonActive
                    : styles.equationModeButton
                }
                onClick={() => setEquationDisplayMode('inline')}
              >
                Inline style
              </button>
            </div>

            <div className={styles.equationPreviewArea}>
              <span className={styles.equationLabel}>Live Preview</span>
              {equationPreviewLatex ? (
                <div
                  className={styles.equationPreviewFormula}
                  data-equation-preview-mode={equationDisplayMode}
                >
                  {equationPreviewDisplayText || equationPreviewLatex}
                </div>
              ) : (
                <div className={styles.equationPreviewPlaceholder}>
                  Type an equation to see the preview.
                </div>
              )}
            </div>
          </div>

          <div className={styles.insertChooserFooter}>
            <button
              type="button"
              className={styles.equationFooterButtonSecondary}
              onClick={closeEquationDialog}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.equationFooterButtonPrimary}
              onClick={confirmEquationInsert}
              disabled={!equationPreviewLatex}
            >
              {isEditing ? 'Update Equation' : 'Insert Equation'}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  function renderOnlineVideoDialog() {
    return createPortal(
      <div
        className={styles.insertChooserOverlay}
        role="dialog"
        aria-modal="true"
        aria-label="Insert online video"
      >
        <div className={styles.onlineVideoDialogShell}>
          <div className={styles.insertChooserHeader}>
            <span>Online Video</span>
            <button
              type="button"
              onClick={closeOnlineVideoDialog}
              aria-label="Close online video dialog"
            >
              ×
            </button>
          </div>

          <div className={styles.onlineVideoDialogBody}>
            <label className={styles.onlineVideoField}>
              <span className={styles.onlineVideoLabel}>Video URL</span>
              <input
                type="url"
                value={onlineVideoUrl}
                onChange={(event) => setOnlineVideoUrl(event.target.value)}
                placeholder="Paste YouTube, Vimeo, embed, or direct video URL"
                className={styles.onlineVideoInput}
                autoFocus
              />
              <span className={styles.onlineVideoHint}>
                Preview updates automatically while you type. Supported: YouTube, Vimeo, embed links, MP4, WebM, and OGG.
              </span>
            </label>

            <label className={styles.onlineVideoField}>
              <span className={styles.onlineVideoLabel}>Title</span>
              <input
                type="text"
                value={onlineVideoTitle}
                onChange={(event) => setOnlineVideoTitle(event.target.value)}
                placeholder="Optional video title"
                className={styles.onlineVideoInput}
              />
            </label>

            <div className={styles.onlineVideoPreviewArea}>
              {onlineVideoPreviewInfo ? (
                onlineVideoPreviewInfo.kind === 'video' ? (
                  <video
                    className={styles.onlineVideoPreviewFrame}
                    src={onlineVideoPreviewInfo.src}
                    controls
                    preload="metadata"
                    title={onlineVideoTitle.trim() || onlineVideoPreviewInfo.title}
                  />
                ) : (
                  <iframe
                    className={styles.onlineVideoPreviewFrame}
                    src={onlineVideoPreviewInfo.src}
                    title={onlineVideoTitle.trim() || onlineVideoPreviewInfo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                )
              ) : (
                <div className={styles.onlineVideoInvalidPreview}>
                  Paste a valid online video URL to see the live preview.
                </div>
              )}
            </div>
          </div>

          <div className={styles.insertChooserFooter}>
            <button
              type="button"
              className={styles.onlineVideoFooterButtonSecondary}
              onClick={closeOnlineVideoDialog}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.onlineVideoFooterButtonPrimary}
              onClick={confirmOnlineVideoInsert}
              disabled={!onlineVideoPreviewInfo}
            >
              Insert Video
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  function renderSignaturePromptModal() {
    if (!signaturePromptConfig || typeof document === 'undefined') return null;

    return createPortal(
      <div
        className={styles.signaturePromptOverlay}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signaturePromptTitle"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closeSignaturePrompt();
          }
        }}
      >
        <div
          className={styles.signaturePromptShell}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              confirmSignaturePrompt();
            }
          }}
        >
          <div className={styles.signaturePromptHeader}>
            <div>
              <span className={styles.signaturePromptEyebrow}>Signature line</span>
              <h3 id="signaturePromptTitle">{signaturePromptConfig.title}</h3>
              <p>{signaturePromptConfig.description}</p>
            </div>

            <button
              type="button"
              className={styles.signaturePromptClose}
              onClick={closeSignaturePrompt}
              aria-label="Close signature line dialog"
            >
              ×
            </button>
          </div>

          <div className={styles.signaturePromptFields}>
            {signaturePromptConfig.fields.map((field, index) => (
              <label key={field.key} className={styles.signaturePromptField}>
                <span>{field.label}</span>
                <input
                  type={field.key === 'signerEmail' ? 'email' : 'text'}
                  value={signaturePromptValues[field.key] || ''}
                  placeholder={field.placeholder}
                  autoFocus={index === 0}
                  onChange={(event) => {
                    handleSignaturePromptChange(field.key, event.target.value);
                  }}
                />
              </label>
            ))}
          </div>

          <div className={styles.signaturePromptActions}>
            <button
              type="button"
              className={styles.signaturePromptCancel}
              onClick={closeSignaturePrompt}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.signaturePromptOk}
              onClick={confirmSignaturePrompt}
            >
              Insert
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  function renderSmartArtChooser() {
    const filteredTemplates = smartArtTemplateOptions.filter((template) => {
      return selectedSmartArtCategory === 'All' || template.category === selectedSmartArtCategory;
    });

    const selectedTemplate =
      smartArtTemplateOptions.find((template) => template.value === selectedSmartArtTemplate) ||
      smartArtTemplateOptions[0];

    return (
      <div className={styles.insertChooserOverlay} role="dialog" aria-modal="true" aria-label="SmartArt">
        <div className={styles.insertChooserShellLarge}>
          <div className={styles.insertChooserHeader}>
            <span>SmartArt</span>
            <button type="button" onClick={() => setIsSmartArtChooserOpen(false)} aria-label="Close SmartArt chooser">
              ×
            </button>
          </div>

          <div className={styles.insertChooserSmartArtBody}>
            <nav className={styles.insertChooserSidebar} aria-label="SmartArt categories">
              {smartArtCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedSmartArtCategory(category)}
                  className={
                    selectedSmartArtCategory === category
                      ? styles.insertChooserTabActive
                      : styles.insertChooserTab
                  }
                >
                  <span>{category}</span>
                </button>
              ))}
            </nav>

            <div className={styles.insertChooserGalleryPane}>
              <div className={styles.insertChooserPaneTitle}>{selectedSmartArtCategory}</div>
              <div className={styles.insertChooserSmartArtGallery}>
                {filteredTemplates.map((template) => (
                  <button
                    key={template.value}
                    type="button"
                    onClick={() => setSelectedSmartArtTemplate(template.value)}
                    className={
                      selectedSmartArtTemplate === template.value
                        ? styles.insertChooserSmartArtTileActive
                        : styles.insertChooserSmartArtTile
                    }
                    title={template.label}
                  >
                    {renderSmartArtChoiceIcon(template.value)}
                    <span>{template.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <aside className={styles.insertChooserPreviewPane}>
              <div className={styles.insertChooserLargePreview}>
                {renderSmartArtChoiceIcon(selectedTemplate.value, true)}
              </div>
              <h4>{selectedTemplate.label}</h4>
              <p>{selectedTemplate.description}</p>
              <p><strong>Usage:</strong> {selectedTemplate.usage}</p>
            </aside>
          </div>

          <div className={styles.insertChooserFooter}>
            <button
              type="button"
              onClick={() => {
                insertSmartArtTemplate(selectedSmartArtTemplate);
                setIsSmartArtChooserOpen(false);
              }}
            >
              Insert
            </button>
            <button type="button" onClick={() => setIsSmartArtChooserOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderChartChooser() {
    const filteredCharts = editableChartOptions.filter((chart) => {
      if (selectedChartCategory === 'All Charts') return true;
      if (selectedChartCategory === 'Recent') return ['column', 'line', 'pie', 'bar', 'combo'].includes(chart.value);
      if (selectedChartCategory === 'Templates') return ['column', 'stackedColumn', 'line', 'pie', 'bar', 'combo'].includes(chart.value);
      return chart.category === selectedChartCategory;
    });

    const selectedChart =
      editableChartOptions.find((chart) => chart.value === selectedChartTemplate) ||
      editableChartOptions[0];

    return (
      <div className={styles.insertChooserOverlay} role="dialog" aria-modal="true" aria-label="Charts">
        <div className={styles.insertChooserShell}>
          <div className={styles.insertChooserHeader}>
            <span>Charts</span>
            <button type="button" onClick={() => setIsChartChooserOpen(false)} aria-label="Close Charts chooser">
              ×
            </button>
          </div>

          <div className={styles.insertChooserChartBody}>
            <nav className={styles.insertChooserSidebar} aria-label="Chart categories">
              {editableChartCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedChartCategory(category)}
                  className={
                    selectedChartCategory === category
                      ? styles.insertChooserTabActive
                      : styles.insertChooserTab
                  }
                >
                  <span>{category}</span>
                </button>
              ))}
            </nav>

            <div className={styles.insertChooserGalleryPane}>
              <div className={styles.insertChooserPaneTitle}>{selectedChartCategory}</div>
              <div className={styles.insertChooserChartGallery}>
                {filteredCharts.map((chart) => (
                  <button
                    key={chart.value}
                    type="button"
                    onClick={() => setSelectedChartTemplate(chart.value)}
                    className={
                      selectedChartTemplate === chart.value
                        ? styles.insertChooserChartTileActive
                        : styles.insertChooserChartTile
                    }
                    title={chart.label}
                  >
                    {renderChartChoiceIcon(chart.value)}
                    <span>{chart.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <aside className={styles.insertChooserPreviewPane}>
              <div className={styles.insertChooserLargePreview}>
                {renderChartChoiceIcon(selectedChart.value, true)}
              </div>
              <h4>{selectedChart.label}</h4>
              <p>{selectedChart.description}</p>
              <p><strong>Usage:</strong> {selectedChart.usage}</p>
            </aside>
          </div>

          <div className={styles.insertChooserFooter}>
            <button
              type="button"
              onClick={() => {
                insertEditableChart(selectedChartTemplate);
                setIsChartChooserOpen(false);
              }}
            >
              Insert
            </button>
            <button type="button" onClick={() => setIsChartChooserOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!editor) return null;

  return (
    <div
      className={`${styles.editorGroup} ${
        isFullscreen ? styles.editorGroupFullscreen : ''
      } ${focusMode ? styles.editorGroupFullscreen : ''}`}
    >
      <style>{`${namedControlsTabsCss}
${homeOnlyControlsCss}
${homeDropdownAndFindFixCss}
${homeFinalNativeSelectFindCss}
${homeCustomNeumorphicDropdownCss}
${homeDropdownPortalCss}
${homeDropdownHomeLayoutFinalCss}
${homeEditableScreenFinalFixCss}
${lmsDesignTemplatesFinalCss}
${layoutFunctionalFinalCss}
${referencesTocDropdownFinalCss}
${footnotesFunctionalFinalCss}
${textBoxCalloutDisabledFinalCss}
${equationCasualInlineFinalCss}
${equationNoToolbarNoGreenCardFinalCss}
${equationAsEditableTextFinalCss}
${equationEditableTextOnlyFinalCss}
${equationPlainTextNoCardRuntimeCss}`}</style>

      <header className={styles.editorHeader}>
        <div className={styles.headerInline}>
          <div className={styles.editorMetaRow}>
            <span>Words count: {editorStats.words}</span>
            <span>Lines: {editorStats.lines}</span>
            <span>
              <Clock3 size={14} />
              {editorStats.readingTime} min read
            </span>

            {lineNumbers && <span>Line numbers on</span>}
            {trackChangesEnabled && <span>Track changes on</span>}

            {enableAutosave && (
              <span
                className={`${styles.saveBadge} ${
                  saveStatus === 'typing'
                    ? styles.saveBadgeTyping
                    : styles.saveBadgeSaved
                }`}
              >
                <Save size={14} />
                {saveStatus === 'typing' ? 'Saving...' : 'Saved'}
              </span>
            )}
          </div>

          <div className={styles.labelRow}>
            <label
              htmlFor={id}
              className={styles.label}
            >
              {label}
              {required && (
                <span className={styles.requiredMark}>
                  *
                </span>
              )}
            </label>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.neomorphicMiniButton}
              onClick={shareDocument}
              title="Share"
            >
              <FileText size={16} />
              <span>Share</span>
            </button>

            {allowFullscreen && (
              <button
                type="button"
                className={styles.neomorphicMiniButton}
                onClick={() => setIsFullscreen(!isFullscreen)}
                title="Toggle Screen Mode"
              >
                {isFullscreen ? (
                  <Minimize2 size={16} />
                ) : (
                  <Maximize2 size={16} />
                )}
                <span>{isFullscreen ? 'Normal View' : 'Full Window'}</span>
              </button>
            )}

            {fullEditorHref && (
              <Link
                href={fullEditorHref}
                className={styles.fullEditorLink}
              >
                <FileText size={16} />
                <span>Dedicated Editor</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div
        className={`${styles.editorShell} ${
          error ? styles.editorShellError : ''
        } ${disabled ? styles.editorShellDisabled : ''}`}
        style={editorShellRuntimeStyle}
      >
        <div className={styles.verticalRibbonLayout}>
          {!isSplitSideBarHidden && (
            <aside
              className={styles.verticalRibbonNav}
              aria-label="Editor ribbon categories"
            >
              {visibleRibbonTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={
                  activeRibbonTab === tab.id
                    ? styles.verticalRibbonTabActive
                    : styles.verticalRibbonTab
                }
                aria-pressed={activeRibbonTab === tab.id}
                onClick={() => setActiveRibbonTab(tab.id)}
              >
                {tab.label}
              </button>
              ))}
            </aside>
          )}

          <section
            className={styles.verticalRibbonPanel}
            aria-label="Selected ribbon tools"
          >
            {showRuler && (
              <div className={styles.editorMetaRow}>
                <span>Ruler: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9</span>
              </div>
            )}

            <div
              ref={toolbarScrollRef}
              className={styles.toolbar}
              data-ribbon-tab={activeRibbonTab}
              onPointerDownCapture={handleTopRibbonPointerDown}
              onMouseDownCapture={handleTopRibbonPointerDown}
              onFocusCapture={handleTopRibbonFocus}
              onClickCapture={handleTopRibbonClick}
              onKeyDownCapture={handleTopRibbonKeyDown}
              onKeyUpCapture={handleTopRibbonKeyUp}
              onInputCapture={handleTopRibbonInputOrChange}
              onChangeCapture={handleTopRibbonInputOrChange}
              onScroll={handleTopRibbonScroll}
            >
          <RibbonGroup
            title="Clipboard"
            tab="file"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={copyPlainText} title="Copy Plain Text">
                <Copy />
                Copy Text
              </button>

              <button type="button" onClick={copyHtml} title="Copy HTML">
                <Code2 />
                Copy HTML
              </button>

              <button type="button" onClick={shareDocument} title="Share">
                <FileText />
                Share
              </button>


              <button type="button" onClick={triggerDocumentImportClick} title="Import File">
                <FilePlus2 />
                Import File
              </button>

              <input
                type="file"
                ref={documentImportInputRef}
                accept=".pdf,.doc,.docx,.rtf,.txt,.md,.html,.htm,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/html,text/markdown"
                className={styles.hiddenInput}
                onChange={handleDocumentImportFileChange}
              />
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Export"
            tab="file"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={downloadWordDocument} title="Download DOC">
                <FileDown />
                DOC
              </button>

              <button type="button" className={styles.exportBtn} onClick={exportPdfDocument} title="Export PDF">
                <FileDown />
                PDF
              </button>

              <button type="button" onClick={printContentOnly} title="Print Content Only">
                <Eye />
                Print
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="History"
            tab="file"
            className={styles.groupHistory}
          >
            <div className={styles.toolbarGroup}>
              <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                title="Undo"
              >
                <Undo2 />
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                title="Redo"
              >
                <Redo2 />
              </button>

              <button
                type="button"
                onClick={createManualSnapshot}
                title="Capture Snapshot"
              >
                <History />
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Font"
            tab="home"
            className={styles.groupFont}
          >
            <div className={styles.fontMatrix}>
              <div className={styles.fontComboWrap}>
                {renderHomeDropdown({
                  dropdownType: 'fontFamily',
                  triggerLabel: fontFamilyInput || 'Font Face',
                  ariaLabel: 'Font Family',
                  options: fontFamilyOptions,
                  selectedValue: fontFamilyInput,
                  rootClassName: 'homeFontDropdown',
                  menuClassName: 'homeFontDropdownMenu',
                  editable: true,
                  inputValue: fontFamilyInput,
                  placeholder: 'Font Face',
                  onInputChange: setFontFamilyInput,
                  onInputCommit: applyFontFamilyInput,
                  onSelect: (option) => {
                    setFontFamilyInput(option.label);
                    applyFontFamilyInput(option.label);
                  },
                })}
              </div>

              <div className={styles.fontComboWrap}>
                {renderHomeDropdown({
                  dropdownType: 'fontSize',
                  triggerLabel: fontSizeInput || 'Size',
                  ariaLabel: 'Font Size',
                  options: fontSizeOptions.map((sizeOption) => ({
                    label: sizeOption,
                    value: sizeOption,
                  })),
                  selectedValue: fontSizeInput,
                  rootClassName: 'homeSizeDropdown',
                  menuClassName: 'homeSizeDropdownMenu',
                  editable: true,
                  inputValue: fontSizeInput,
                  placeholder: 'Size',
                  inputMode: 'decimal',
                  onInputChange: setFontSizeInput,
                  onInputCommit: applyFontSizeInput,
                  onSelect: (option) => applyFontSize(option.value),
                })}
              </div>

              <button type="button" onClick={() => changeFontSize(-1)} title="Decrease Font Size">
                <Minus />
                A-
              </button>
              <button type="button" onClick={() => changeFontSize(1)} title="Increase Font Size">
                <Plus />
                A+
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? styles.activeButton : ''}
                title="Bold"
              >
                <Bold />
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? styles.activeButton : ''}
                title="Italic"
              >
                <Italic />
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={editor.isActive('underline') ? styles.activeButton : ''}
                title="Underline"
              >
                <UnderlineIcon />
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={editor.isActive('strike') ? styles.activeButton : ''}
                title="Strikethrough"
              >
                <Strikethrough />
              </button>

              {renderHomeDropdown({
                dropdownType: 'textColor',
                triggerLabel:
                  colorOptions.find((option) => option.value === selectedTextColorValue)
                    ?.label || 'Text Color',
                ariaLabel: 'Preset Text Color',
                options: colorOptions.map((option) => ({
                  ...option,
                  color: option.value,
                })),
                selectedValue: selectedTextColorValue,
                rootClassName: 'homeTextColorDropdown homeColorControl',
                menuClassName: 'homeColorDropdownMenu',
                onSelect: (option) => {
                  setSelectedTextColorValue(option.value);
                  setCustomTextColor(option.value);
                  editor.chain().focus().setColor(option.value).run();
                  notifyEditorChange();
                },
              })}

              <input
                type="color"
                value={customTextColor}
                onChange={(event) => setCustomTextColor(event.target.value)}
                onBlur={applyCustomTextColor}
                title="Custom Text Color"
                aria-label="Custom Text Color"
              />

              <button
                type="button"
                onClick={applyCustomTextColor}
                title="Apply Custom Text Color"
              >
                <Palette />
                Apply Color
              </button>

              {renderHomeDropdown({
                dropdownType: 'highlightColor',
                triggerLabel:
                  highlightOptions.find((option) => option.value === selectedHighlightColorValue)
                    ?.label || 'Highlight',
                ariaLabel: 'Preset Highlight Color',
                options: highlightOptions.map((option) => ({
                  ...option,
                  color: option.value,
                })),
                selectedValue: selectedHighlightColorValue,
                rootClassName: 'homeHighlightDropdown homeColorControl',
                menuClassName: 'homeHighlightDropdownMenu',
                onSelect: (option) => {
                  setSelectedHighlightColorValue(option.value);
                  setCustomHighlightColor(option.value);
                  editor.chain().focus().setHighlight({
                    color: option.value,
                  }).run();
                  notifyEditorChange();
                },
              })}

              <input
                type="color"
                value={customHighlightColor}
                onChange={(event) => setCustomHighlightColor(event.target.value)}
                onBlur={applyCustomHighlightColor}
                title="Custom Highlight Color"
                aria-label="Custom Highlight Color"
              />

              <button
                type="button"
                onClick={applyCustomHighlightColor}
                title="Apply Custom Highlight"
              >
                <Highlighter />
                Apply Highlight
              </button>

              <button
                type="button"
                onClick={clearTextStyle}
                title="Clear Formatting"
              >
                <Eraser />
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Paragraph"
            tab="home"
            className={styles.groupParagraph}
          >
            <div className={styles.toolbarGroup}>
              {renderHomeDropdown({
                dropdownType: 'paragraphPreset',
                triggerLabel:
                  paragraphPresetOptions.find(
                    (option) => option.value === selectedParagraphPresetValue
                  )?.label || 'Paragraph',
                ariaLabel: 'Paragraph Preset',
                options: paragraphPresetOptions,
                selectedValue: selectedParagraphPresetValue,
                rootClassName: 'homeParagraphDropdown',
                menuClassName: 'homeParagraphDropdownMenu',
                onSelect: (option) => {
                  setSelectedParagraphPresetValue(option.value);
                  applyParagraphPreset(option.value);
                },
              })}

              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={editor.isActive({ textAlign: 'left' }) ? styles.activeButton : ''}
                title="Align Left"
              >
                <AlignLeft />
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={editor.isActive({ textAlign: 'center' }) ? styles.activeButton : ''}
                title="Align Center"
              >
                <AlignCenter />
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={editor.isActive({ textAlign: 'right' }) ? styles.activeButton : ''}
                title="Align Right"
              >
                <AlignRight />
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                className={editor.isActive({ textAlign: 'justify' }) ? styles.activeButton : ''}
                title="Justify"
              >
                <AlignJustify />
              </button>

              {renderHomeDropdown({
                dropdownType: 'lineSpacing',
                triggerLabel:
                  lineSpacingOptions.find(
                    (option) => option.value === selectedLineSpacingValue
                  )?.label || 'Spacing',
                ariaLabel: 'Line Spacing',
                options: lineSpacingOptions,
                selectedValue: selectedLineSpacingValue,
                rootClassName: 'homeSpacingDropdown',
                menuClassName: 'homeSpacingDropdownMenu',
                onSelect: (option) => {
                  setSelectedLineSpacingValue(option.value);
                  applyLineSpacing(option.value);
                },
              })}
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Lists"
            tab="home"
            className={styles.groupStructures}
          >
            <div className={styles.toolbarGroup}>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleBulletList().run();

                  runAfterEditorStateUpdate(() => {
                    if (editor.isActive('bulletList')) {
                      applyListNodeStyle('bulletList', 'disc');
                    }
                  });
                }}
                className={editor.isActive('bulletList') ? styles.activeButton : ''}
                title="Bullet List"
              >
                <List />
              </button>

              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleOrderedList().run();

                  runAfterEditorStateUpdate(() => {
                    if (editor.isActive('orderedList')) {
                      applyListNodeStyle('orderedList', 'decimal');
                    }
                  });
                }}
                className={editor.isActive('orderedList') ? styles.activeButton : ''}
                title="Numbered List"
              >
                <ListOrdered />
              </button>

              <button
                type="button"
                onClick={toggleChecklist}
                className={
                  editor.isActive('bulletList') && selectedBulletStyleValue === 'check'
                    ? styles.activeButton
                    : ''
                }
                title="Check Bullet List"
              >
                <ListChecks />
              </button>

              <button
                type="button"
                onClick={toggleQuoteBlock}
                className={editor.isActive('blockquote') ? styles.activeButton : ''}
                title="Blockquote"
              >
                <Quote />
              </button>

              {renderHomeDropdown({
                dropdownType: 'bulletStyle',
                triggerLabel:
                  bulletStyleOptions.find(
                    (option) => option.value === selectedBulletStyleValue
                  )?.label || 'Bullet Style',
                ariaLabel: 'Bullet Style',
                options: bulletStyleOptions,
                selectedValue: selectedBulletStyleValue,
                rootClassName: 'homeBulletStyleControl',
                menuClassName: 'homeBulletDropdownMenu',
                showDescriptions: true,
                onSelect: (option) => applyBulletStyle(option.value),
              })}

              {renderHomeDropdown({
                dropdownType: 'numberStyle',
                triggerLabel:
                  orderedListStyleOptions.find(
                    (option) => option.value === selectedNumberStyleValue
                  )?.label || 'Number Style',
                ariaLabel: 'Number Style',
                options: orderedListStyleOptions,
                selectedValue: selectedNumberStyleValue,
                rootClassName: 'homeNumberStyleControl',
                menuClassName: 'homeNumberDropdownMenu',
                onSelect: (option) => applyOrderedListStyle(option.value),
              })}

              <button type="button" onClick={outdentListItem} title="Decrease List Indent">
                <Outdent />
                Outdent
              </button>

              <button type="button" onClick={indentListItem} title="Increase List Indent">
                <Indent />
                Indent
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Styles"
            tab="home"
            className={styles.groupHeadings}
          >
            <div className={styles.toolbarGroup}>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive('heading', { level: 1 }) ? styles.activeButton : ''}
                title="Heading 1"
              >
                <Heading1 />
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? styles.activeButton : ''}
                title="Heading 2"
              >
                <Heading2 />
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={editor.isActive('heading', { level: 3 }) ? styles.activeButton : ''}
                title="Heading 3"
              >
                <Heading3 />
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                className={editor.isActive('heading', { level: 4 }) ? styles.activeButton : ''}
                title="Heading 4"
              >
                <Heading4 />
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
                className={editor.isActive('heading', { level: 5 }) ? styles.activeButton : ''}
                title="Heading 5"
              >
                <Heading5 />
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
                className={editor.isActive('heading', { level: 6 }) ? styles.activeButton : ''}
                title="Heading 6"
              >
                <Heading6 />
              </button>

              {renderHomeDropdown({
                dropdownType: 'textCase',
                triggerLabel:
                  textTransformOptions.find(
                    (option) => option.value === selectedTextCaseValue
                  )?.label || 'Case',
                ariaLabel: 'Change Selected Text Case',
                options: textTransformOptions,
                selectedValue: selectedTextCaseValue,
                rootClassName: 'homeCaseDropdown',
                menuClassName: 'homeCaseDropdownMenu',
                onSelect: (option) => {
                  setSelectedTextCaseValue(option.value);
                  transformSelectedText(option.value);
                },
              })}
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Pages"
            tab="insert"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <select
                className={styles.toolbarSelect}
                value=""
                onChange={(event) => {
                  handleCoverPageTemplateSelect(event.target.value);
                  event.currentTarget.value = '';
                }}
                title="Cover Page"
                aria-label="Cover Page Template"
              >
                <option value="">Cover Page</option>
                {coverPageTemplateOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button type="button" onClick={insertPageBreak} title="Page Break">
                <FilePlus2 />
                Page Break
              </button>

              <button type="button" onClick={insertBlankPage} title="Blank Page">
                <FilePlus2 />
                Blank Page
              </button>

              <button type="button" onClick={insertDateTime} title="Date & Time">
                <Clock3 />
                Date & Time
              </button>

              <select
                className={`${styles.toolbarSelect} ${styles.insertTemplateDropdown}`}
                defaultValue=""
                onChange={(event) => {
                  const selectedValue = event.currentTarget.value;
                  event.currentTarget.selectedIndex = 0;
                  window.setTimeout(() => handleHeaderTemplateSelect(selectedValue), 0);
                }}
                title="Header Samples"
                aria-label="Header Samples"
              >
                <option value="">Header</option>
                {headerTemplateOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                className={`${styles.toolbarSelect} ${styles.insertTemplateDropdown}`}
                defaultValue=""
                onChange={(event) => {
                  const selectedValue = event.currentTarget.value;
                  event.currentTarget.selectedIndex = 0;
                  window.setTimeout(() => handleFooterTemplateSelect(selectedValue), 0);
                }}
                title="Footer Samples"
                aria-label="Footer Samples"
              >
                <option value="">Footer</option>
                {footerTemplateOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button type="button" onClick={insertPageNumberBlock} title="Page Number">
                <FileText />
                Page Number
              </button>

              <select
                className={`${styles.toolbarSelect} ${styles.signatureLineDropdown}`}
                defaultValue=""
                onChange={(event) => {
                  const selectedValue = event.currentTarget.value;
                  event.currentTarget.selectedIndex = 0;
                  window.setTimeout(() => handleSignatureTemplateSelect(selectedValue), 0);
                }}
                title="Signature Line"
                aria-label="Signature Line Format"
              >
                <option value="">Signature Line</option>
                {signatureLineTemplateOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button type="button" onClick={insertSeparatorLine} title="Separator">
                <Minus />
                Separator
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Tables / Charts"
            tab="insert"
            className={styles.groupInsertions}
          >
            <div className={styles.toolbarGroup}>
              <select
                className={styles.toolbarSelect}
                value={insertTableRows}
                onChange={(event) => setInsertTableRows(Number(event.target.value))}
                title="Table Rows"
                aria-label="Table Rows"
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map((row) => (
                  <option key={row} value={row}>
                    Rows: {row}
                  </option>
                ))}
              </select>

              <select
                className={styles.toolbarSelect}
                value={insertTableCols}
                onChange={(event) => setInsertTableCols(Number(event.target.value))}
                title="Table Columns"
                aria-label="Table Columns"
              >
                {Array.from({ length: 10 }, (_, index) => index + 1).map((col) => (
                  <option key={col} value={col}>
                    Columns: {col}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => insertCustomTable()}
                title="Insert Selected Table"
              >
                <Table2 />
                Insert Table
              </button>

              <button
                type="button"
                onClick={() => insertCustomTable(3, 3)}
                title="Quick 3 x 3 Table"
              >
                <Table2 />
                Quick 3 x 3
              </button>

              <button
                type="button"
                onClick={insertChartPlaceholder}
                title="Charts"
              >
                <BarChart3 />
                Charts
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Illustrations"
            tab="insert"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              {enableImageUpload && (
                <>
                  <button
                    type="button"
                    onClick={triggerImageUploadClick}
                    title="Upload Image"
                  >
                    <ImageIcon />
                    Picture
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className={styles.hiddenInput}
                    onChange={handleFileChange}
                  />
                </>
              )}

              <button type="button" onClick={insertImageFromUrl} title="Image from URL">
                <ImageIcon />
                Image URL
              </button>

              <button
                type="button"
                onClick={insertSmartArtPlaceholder}
                title="SmartArt"
              >
                <Sparkles />
                SmartArt
              </button>

              <button type="button" onClick={insertScreenshotPlaceholder} title="Screenshot Placeholder">
                <ImageIcon />
                Screenshot
              </button>

              <button type="button" onClick={insertTextBox} title="Text Box">
                <FileText />
                Text Box
              </button>

              <select
                className={`${styles.toolbarSelect} ${styles.quickPartsSelect}`}
                defaultValue=""
                onChange={(event) => {
                  const selectedValue = event.currentTarget.value;
                  event.currentTarget.selectedIndex = 0;
                  insertQuickPart(selectedValue);
                }}
                title="Quick Parts"
                aria-label="Quick Parts"
              >
                <option value="">Quick Parts</option>
                <option value="currentDate">Insert Current Date</option>
                <option value="documentTitle">Insert Document Title</option>
                <option value="institutionName">Insert Institution Name</option>
                <option value="courseName">Insert Course Name</option>
                <option value="courseCode">Insert Course Code</option>
                <option value="noteBlock">Insert Note Block</option>
                <option value="instructionBlock">Insert Instruction Block</option>
              </select>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Picture Tools"
            tab="insert"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              {/* <button type="button" onClick={() => applySelectedImageAlignment('left')} title="Image Align Left">
                <AlignLeft />
                Align Left
              </button>

              <button type="button" onClick={() => applySelectedImageAlignment('center')} title="Image Align Center">
                <AlignCenter />
                Align Center
              </button>

              <button type="button" onClick={() => applySelectedImageAlignment('right')} title="Image Align Right">
                <AlignRight />
                Align Right
              </button> */}

              <button type="button" onClick={() => applySelectedImageAlignment('float-left')} title="Wrap Text Left">
                <WrapText />
                Wrap Left
              </button>

              <button type="button" onClick={() => applySelectedImageAlignment('float-right')} title="Wrap Text Right">
                <WrapText />
                Wrap Right
              </button>

              <button type="button" onClick={() => applySelectedImageWidth('25%')} title="Image Small">
                <Minimize2 />
                Small
              </button>

              <button type="button" onClick={() => applySelectedImageWidth('50%')} title="Image Medium">
                <ImageIcon />
                Medium
              </button>

              <button type="button" onClick={() => applySelectedImageWidth('75%')} title="Image Large">
                <Maximize2 />
                Large
              </button>

              <button type="button" onClick={() => applySelectedImageWidth('100%')} title="Image Page Width">
                <Maximize2 />
                Page Width
              </button>

              {/* <button type="button" onClick={enableSelectedImageFreePosition} title="Free Drag Position">
                <MousePointer2 />
                Free Drag
              </button> */}

              {/* <button type="button" onClick={resetSelectedImageCrop} title="Reset Image Crop">
                <Minimize2 />
                Reset Crop
              </button> */}

              <button type="button" onClick={updateSelectedImageAltText} title="Image Alt Text">
                <Info />
                Alt Text
              </button>

              {/* <button type="button" onClick={deleteSelectedImage} title="Delete Selected Image">
                <Trash2 />
                Delete
              </button> */}

              {/* <button type="button" onClick={resetSelectedImageFormat} title="Reset Image">
                <RotateCw />
                Reset
              </button> */}
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Media"
            tab="insert"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={insertOnlineVideo} title="Online Video">
                <Video />
                Online Video
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Links"
            tab="insert"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button
                type="button"
                onClick={insertLink}
                className={editor.isActive('link') ? styles.activeButton : ''}
                title="Insert Hyperlink"
              >
                <Link2 />
                Link
              </button>

              <button type="button" onClick={insertBookmark} title="Bookmark">
                <Bookmark />
                Bookmark
              </button>

              <button type="button" onClick={insertCrossReference} title="Cross-reference">
                <Link2 />
                Cross-reference
              </button>
            </div>
          </RibbonGroup>

          {/* <RibbonGroup
            title="Comments"
            tab="insert"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={insertReviewComment}>
                <MessageSquare />
                Comment
              </button>
            </div>
          </RibbonGroup> */}

          <RibbonGroup
            title="Symbols"
            tab="insert"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={insertEquation}>
                <Sigma />
                Equation
              </button>

              <select
                className={styles.toolbarSelect}
                defaultValue=""
                onChange={(event) => {
                  insertSymbol(event.target.value);
                  event.target.value = '';
                }}
              >
                <option value="" disabled>
                  ∑
                </option>
                {symbolOptions.map((symbol) => (
                  <option key={symbol.value} value={symbol.value}>
                    {symbol.label}
                  </option>
                ))}
              </select>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="LMS Document Designs"
            tab="design"
            className={`${styles.groupExtra} lmsDesignTemplatesGroup`}
          >
            <div className={`${styles.toolbarGroup} lmsDesignTemplatesGrid`}>
              <button type="button" onClick={() => applyTheme('academic')} title="Academic">
                <Sparkles />
                Academic
              </button>

              <button type="button" onClick={() => applyTheme('university')} title="University">
                <Sparkles />
                University
              </button>

              <button type="button" onClick={() => applyTheme('college')} title="College">
                <Sparkles />
                College
              </button>

              <button type="button" onClick={() => applyTheme('school')} title="School">
                <Sparkles />
                School
              </button>

              <button type="button" onClick={() => applyTheme('government')} title="Government">
                <Sparkles />
                Government
              </button>

              <button type="button" onClick={() => applyTheme('ngo')} title="NGO">
                <Sparkles />
                NGO
              </button>

              <button type="button" onClick={() => applyTheme('corporate')} title="Corporate">
                <Sparkles />
                Corporate
              </button>

              <button type="button" onClick={() => applyTheme('skillAcademy')} title="Skill Academy">
                <Sparkles />
                Skill Academy
              </button>

              <button type="button" onClick={() => applyTheme('bootcamp')} title="Bootcamp">
                <Sparkles />
                Bootcamp
              </button>

              <button type="button" onClick={() => applyTheme('research')} title="Research Paper">
                <Sparkles />
                Research Paper
              </button>

              <button type="button" onClick={() => applyTheme('publishing')} title="Publishing">
                <Sparkles />
                Publishing
              </button>

              <button type="button" onClick={() => applyTheme('certificate')} title="Certificate">
                <Sparkles />
                Certificate
              </button>

              <button type="button" onClick={() => applyTheme('report')} title="Report">
                <Sparkles />
                Report
              </button>

              <button type="button" onClick={() => applyTheme('minimal')} title="Minimal">
                <Sparkles />
                Minimal
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Page Setup"
            tab="layout"
            className={styles.groupTable}
          >
            <div className={styles.toolbarGroup}>
              <select
                className={styles.toolbarSelect}
                value={pageMargin}
                onChange={(event) => setPageMargin(event.target.value as LayoutMarginPreset)}
              >
                <option value="normal">Margins: Normal</option>
                <option value="narrow">Margins: Narrow</option>
                <option value="wide">Margins: Wide</option>
                <option value="mirrored">Margins: Mirrored</option>
                <option value="custom">Margins: Custom</option>
              </select>

              <select
                className={styles.toolbarSelect}
                value={pageOrientation}
                onChange={(event) => setPageOrientation(event.target.value as 'portrait' | 'landscape')}
              >
                <option value="portrait">Orientation: Portrait</option>
                <option value="landscape">Orientation: Landscape</option>
              </select>

              <select
                className={styles.toolbarSelect}
                value={pageSize}
                onChange={(event) => setPageSize(event.target.value as LayoutPageSizePreset)}
              >
                <option value="A4">Size: A4</option>
                <option value="Letter">Size: Letter</option>
                <option value="Legal">Size: Legal</option>
              </select>

              <select
                className={styles.toolbarSelect}
                value={columnPreset}
                onChange={(event) => applyLayoutColumns(event.target.value as LayoutColumnPreset)}
              >
                <option value="1">Columns: One</option>
                <option value="2">Columns: Two</option>
                <option value="3">Columns: Three</option>
                <option value="left">Columns: Left</option>
                <option value="right">Columns: Right</option>
              </select>

              <button type="button" onClick={insertLayoutBreak} title="Breaks">
                <FilePlus2 />
                Breaks
              </button>

              <button type="button" onClick={() => setLineNumbers(!lineNumbers)} className={lineNumbers ? styles.activeButton : ''} title="Line Numbers">
                <ListOrdered />
                Line Numbers
              </button>

              <button type="button" onClick={() => setHyphenation(!hyphenation)} className={hyphenation ? styles.activeButton : ''} title="Hyphenation">
                <Sigma />
                Hyphenation
              </button>

              <button type="button" onClick={() => applyPagePreset('normal')} className={pageViewMode === 'normal' ? styles.activeButton : ''} title="Normal Page">
                <FileText />
                Normal Page
              </button>

              <button type="button" onClick={() => applyPagePreset('compact')} className={pageViewMode === 'compact' ? styles.activeButton : ''} title="Compact">
                <Sparkles />
                Compact
              </button>

              <button type="button" onClick={() => applyPagePreset('landscape-two-column')} className={pageOrientation === 'landscape' && columnCount === 2 ? styles.activeButton : ''} title="Landscape 2 Col">
                <Columns3 />
                Landscape 2 Col
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Arrange"
            tab="layout"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={applyLayoutPosition} title="Position">
                <MousePointer2 />
                Position
              </button>

              <button type="button" onClick={applyLayoutWrapText} title="Wrap Text">
                <WrapText />
                Wrap Text
              </button>

              <button type="button" onClick={toggleSelectionPane} className={selectionPaneOpen ? styles.activeButton : ''} title="Selection Pane">
                <PanelTop />
                Selection Pane
              </button>

              <button type="button" onClick={applyLayoutAlign} title="Align">
                <AlignLeft />
                Align
              </button>

              <button type="button" onClick={applyLayoutGroup} title="Group">
                <Braces />
                Group
              </button>

              <button type="button" onClick={applyLayoutRotate} title="Rotate">
                <RotateCw />
                Rotate
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Table of Contents"
            tab="references"
            className={`${styles.groupExtra} referencesTocGroup`}
          >
            <div className={`${styles.toolbarGroup} referencesTocControls`}>
              <select
                className={styles.toolbarSelect}
                value={selectedTableOfContents}
                onChange={(event) => {
                  const nextTableOfContents = event.target.value as TableOfContentsPreset;
                  setSelectedTableOfContents(nextTableOfContents);
                  insertTableOfContents(nextTableOfContents);
                }}
                title="Choose Table of Contents Type"
                aria-label="Choose Table of Contents Type"
              >
                {tableOfContentsOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

            
              <button type="button" onClick={triggerTocImportClick} title="Import TOC">
                <FilePlus2 />
                Import TOC
              </button>

              <input
                type="file"
                ref={tocImportInputRef}
                accept=".doc,.docx,.pdf,.txt,.html,.htm,.md,.rtf,.csv,image/*"
                className={styles.hiddenInput}
                onChange={handleTocImportFileChange}
              />

              <button type="button" onClick={() => insertTableOfContents(selectedTableOfContents)} title="Update Table">
                <RotateCw />
                Update Table
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Footnotes"
            tab="references"
            className={`${styles.groupExtra} referencesFootnotesGroup`}
          >
            <div className={`${styles.toolbarGroup} referencesFootnotesControls`}>
              <button type="button" onClick={() => insertFootnote('footnote')} title="Insert Footnote">
                <MessageSquare />
                Insert Footnote
              </button>

              <button type="button" onClick={() => insertFootnote('endnote')} title="Insert Endnote">
                <MessageSquare />
                Insert Endnote
              </button>

              <button type="button" onClick={goToNextFootnote} title="Next Footnote">
                <Redo2 />
                Next Footnote
              </button>

              <button type="button" onClick={showDocumentNotes} title="Show Notes">
                <MessageSquare />
                Show Notes
              </button>

              <button type="button" onClick={() => setFootnoteSettingsOpen(true)} title="Footnotes">
                <Info />
                Footnotes
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Citations"
            tab="references"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={insertCitation}>
                <BookOpen />
                Insert Citation
              </button>

              <button type="button" onClick={() => window.alert(`Sources:\n\n${citationSources.map((s) => s.label).join('\n') || 'No sources added.'}`)}>
                <BookOpen />
                Manage Sources
              </button>

              <select className={styles.toolbarSelect} defaultValue="APA">
                <option value="APA">Style: APA</option>
                <option value="MLA">Style: MLA</option>
                <option value="Chicago">Style: Chicago</option>
              </select>

              <button type="button" onClick={insertBibliography}>
                <BookOpen />
                Bibliography
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Captions"
            tab="references"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={insertCaption}>
                <ImageIcon />
                Insert Caption
              </button>

              <button type="button" onClick={insertTableOfFigures}>
                <ImageIcon />
                Table of Figures
              </button>

              <button type="button" onClick={insertCrossReference}>
                <Link2 />
                Cross-reference
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Index"
            tab="references"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={markIndexEntry}>
                <BookOpen />
                Mark Entry
              </button>

              <button type="button" onClick={insertIndex}>
                <BookOpen />
                Insert Index
              </button>

              <button type="button" onClick={insertIndex}>
                <Redo2 />
                Update Index
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Authorities"
            tab="references"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={markCitationForAuthority}>
                <BookOpen />
                Mark Citation
              </button>

              <button type="button" onClick={insertTableOfAuthorities}>
                <Table2 />
                Table of Authorities
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Create"
            tab="mailings"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={insertEnvelopeBlock}>
                <Mail />
                Envelopes
              </button>

              <button type="button" onClick={insertLabelSheet}>
                <Mail />
                Labels
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Mail Merge"
            tab="mailings"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={insertMailMergeField}>
                <Mail />
                Insert Merge Field
              </button>

              <button type="button" onClick={() => insertPromptedBlock('Recipient List', 'Recipient name and email')}>
                <Mail />
                Recipients
              </button>

              <button type="button" onClick={() => window.alert('Preview Results: merge fields are shown as «FieldName».')}>
                <Mail />
                Preview Results
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Proofing"
            tab="review"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={runSpellingGrammarBasicCheck}>
                <CheckCircle2 />
                Spelling & Grammar
              </button>

              <button type="button" onClick={() => insertPromptedBlock('Thesaurus Note', 'Add synonym suggestion here.')}>
                <BookOpen />
                Thesaurus
              </button>

              <button type="button" onClick={showWordCountDialog}>
                <Eye />
                Word Count
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Speech"
            tab="review"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={readAloud}>
                <Volume2 />
                Read Aloud
              </button>

              <button type="button" onClick={stopReadAloud}>
                <VolumeX />
                Stop Speech
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Accessibility"
            tab="review"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={runAccessibilityCheck}>
                <CheckCircle2 />
                Check Accessibility
              </button>

              <button type="button" onClick={addAltTextToImages}>
                <ImageIcon />
                Alt Text
              </button>

              <button type="button" onClick={showNavigationPane}>
                <PanelTop />
                Navigation Pane
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Language"
            tab="review"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={() => runAiAction('translate')}>
                <Languages />
                Translate
              </button>

              <button type="button" onClick={() => window.alert(`Current target language: ${targetLanguage}`)}>
                <Languages />
                Language
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Comments"
            tab="review"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={insertReviewComment}>
                <MessageSquare />
                New Comment
              </button>

              <button type="button" onClick={() => setComments([])}>
                <MessageSquare />
                Delete
              </button>

              <button type="button" onClick={() => window.alert(comments[0]?.text || 'No previous comment.')}>
                <Undo2 />
                Previous
              </button>

              <button type="button" onClick={() => window.alert(comments[comments.length - 1]?.text || 'No next comment.')}>
                <Redo2 />
                Next
              </button>

              <button type="button" onClick={() => window.alert(comments.map((c) => `• ${c.text}`).join('\n') || 'No comments.')}>
                <Eye />
                Show Comments
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Tracking"
            tab="review"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={() => setTrackChangesEnabled(!trackChangesEnabled)}>
                <History />
                Track Changes
              </button>

              <select className={styles.toolbarSelect} defaultValue="simple">
                <option value="simple">Simple Markup</option>
                <option value="all">All Markup</option>
                <option value="none">No Markup</option>
              </select>

              <button type="button" onClick={() => window.alert('Show Markup: comments and tracked-state badges are shown in the editor.')}>
                <Eye />
                Show Markup
              </button>

              <button type="button" onClick={() => window.alert('Reviewing Pane: comments are shown below the editor.')}>
                <PanelTop />
                Reviewing Pane
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Changes"
            tab="review"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={acceptChanges}>
                <CheckCircle2 />
                Accept
              </button>

              <button type="button" onClick={rejectChanges}>
                <Trash2 />
                Reject
              </button>

              <button type="button" onClick={() => window.alert('Previous Change: not available without a saved change-tracking diff.')}>
                <Undo2 />
                Previous
              </button>

              <button type="button" onClick={() => window.alert('Next Change: not available without a saved change-tracking diff.')}>
                <Redo2 />
                Next
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Compare / Protect"
            tab="review"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={compareSnapshot}>
                <History />
                Compare
              </button>

              <button type="button" onClick={restrictEditing}>
                <ShieldCheck />
                Restrict Editing
              </button>

              <button type="button" onClick={() => window.alert('Hide Ink: no ink annotations are currently rendered.')}>
                <Eye />
                Hide Ink
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Views"
            tab="view"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={() => setEditorMode('preview')}>
                <Eye />
                Read Mode
              </button>

              <button type="button" onClick={() => setEditorMode('write')}>
                <Printer />
                Print Layout
              </button>

              <button type="button" onClick={() => setEditorMode('split')}>
                <Eye />
                Web Layout
              </button>

              <button type="button" onClick={() => insertTableOfContents()}>
                <List />
                Outline
              </button>

              <button type="button" onClick={() => setEditorMode('write')}>
                <FileText />
                Draft
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Immersive"
            tab="view"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={() => setFocusMode(!focusMode)}>
                <Maximize2 />
                Focus
              </button>

              <button type="button" onClick={readAloud}>
                <Volume2 />
                Immersive Reader
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Show"
            tab="view"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={() => setShowRuler(!showRuler)}>
                <Eye />
                Ruler
              </button>

              <button type="button" onClick={() => setShowGridlines(!showGridlines)}>
                <Eye />
                Gridlines
              </button>

              <button type="button" onClick={showNavigationPane}>
                <PanelTop />
                Navigation Pane
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Zoom"
            tab="view"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={() => setZoomPercent(Math.max(50, zoomPercent - 10))}>
                <ZoomOut />
                Zoom -
              </button>

              <button type="button" onClick={() => setZoomPercent(100)}>
                <Clock3 />
                100%
              </button>

              <button type="button" onClick={() => setZoomPercent(Math.min(200, zoomPercent + 10))}>
                <ZoomIn />
                Zoom +
              </button>

              <button type="button" onClick={() => setZoomPercent(85)}>
                <FileText />
                One Page
              </button>

              <button type="button" onClick={() => setZoomPercent(70)}>
                <Columns3 />
                Multiple Pages
              </button>

              <button type="button" onClick={() => setZoomPercent(120)}>
                <FileText />
                Page Width
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Window"
            tab="view"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={() => window.open(window.location.href, '_blank')}>
                <Maximize2 />
                New Window
              </button>

              <button type="button" onClick={() => setEditorMode('split')}>
                <Sparkles />
                Split
              </button>

              <button type="button" onClick={() => setEditorMode('split')}>
                <Columns3 />
                View Side by Side
              </button>

              <button type="button" onClick={() => window.alert('Synchronous Scrolling is controlled by browser scroll behavior.')}>
                <WrapText />
                Sync Scrolling
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Macros"
            tab="view"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={() => insertDateTime()}>
                <Clock3 />
                Macro: Date
              </button>

              <button type="button" onClick={() => insertSignatureBlock()}>
                <CheckCircle2 />
                Macro: Sign Block
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Help"
            tab="help"
            className={styles.groupTable}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={() => window.alert('Keyboard Shortcuts\n\nCtrl+B: Bold\nCtrl+I: Italic\nCtrl+Z: Undo\nCtrl+Y: Redo')}>
                <Redo2 />
                Keyboard Shortcuts
              </button>

              <button type="button" onClick={() => window.alert('Use the top ribbon tabs to access File, Home, Insert, Layout, References, Review, View, Academic, and AI tools.')}>
                <GraduationCap />
                Editor Help
              </button>

              <button type="button" onClick={() => window.alert(`About\n\n${label}\nWords: ${editorStats.words}\nLines: ${editorStats.lines}`)}>
                <Info />
                About
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Acrobat"
            tab="acrobat"
            className={styles.groupExtra}
          >
            <div className={styles.toolbarGroup}>
              <button type="button" onClick={exportPdfDocument}>
                <FileText />
                Create PDF
              </button>

              <button type="button" onClick={printContentOnly}>
                <FileDown />
                Print PDF
              </button>

              <button type="button" onClick={shareDocument}>
                <FileText />
                Share PDF Text
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Table Tools"
            tab="insert"
            className={styles.groupTable}
          >
            <div
              className={styles.toolbarGroup}
              style={tableToolsGridStyle}
            >
              <button
                type="button"
                style={tableToolButtonStyle}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runTableCommand('addColumnBefore')}
                disabled={!hasTableInDocument}
                title="Add Column Before"
              >
                <Maximize2 />
                Add Col Before
              </button>

              <button
                type="button"
                style={tableToolButtonStyle}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runTableCommand('addColumnAfter')}
                disabled={!hasTableInDocument}
                title="Add Column After"
              >
                <Maximize2 />
                Add Col After
              </button>

              <button
                type="button"
                style={tableToolButtonStyle}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runTableCommand('deleteColumn')}
                disabled={!hasTableInDocument}
                title="Delete Column"
              >
                <Trash2 />
                Delete Col
              </button>

              <button
                type="button"
                style={tableToolButtonStyle}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runTableCommand('addRowBefore')}
                disabled={!hasTableInDocument}
                title="Add Row Before"
              >
                <Maximize2 />
                Add Row Before
              </button>

              <button
                type="button"
                style={tableToolButtonStyle}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runTableCommand('addRowAfter')}
                disabled={!hasTableInDocument}
                title="Add Row After"
              >
                <Maximize2 />
                Add Row After
              </button>

              <button
                type="button"
                style={tableToolButtonStyle}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runTableCommand('deleteRow')}
                disabled={!hasTableInDocument}
                title="Delete Row"
              >
                <Trash2 />
                Delete Row
              </button>

              <button
                type="button"
                style={tableToolButtonStyle}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runTableCommand('deleteTable')}
                disabled={!hasTableInDocument}
                title="Delete Table"
              >
                <Trash2 />
                Delete Table
              </button>

              <button
                type="button"
                style={tableToolButtonStyle}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runTableCommand('mergeCells')}
                disabled={!hasTableInDocument}
                title="Merge Cells"
              >
                <Mail />
                Merge Cells
              </button>

              <button
                type="button"
                style={tableToolButtonStyle}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runTableCommand('splitCell')}
                disabled={!hasTableInDocument}
                title="Split Cell"
              >
                <Maximize2 />
                Split Cell
              </button>

              <button
                type="button"
                style={tableToolButtonStyle}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runTableCommand('toggleHeaderRow')}
                disabled={!hasTableInDocument}
                title="Toggle Header Row"
              >
                <Maximize2 />
                Header Row
              </button>

              <button
                type="button"
                style={tableToolButtonStyle}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runTableCommand('toggleHeaderColumn')}
                disabled={!hasTableInDocument}
                title="Toggle Header Column"
              >
                <Maximize2 />
                Header Column
              </button>

              <button
                type="button"
                style={tableToolButtonStyle}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runTableCommand('toggleHeaderCell')}
                disabled={!hasTableInDocument}
                title="Toggle Header Cell"
              >
                <Maximize2 />
                Header Cell
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup
            title="Find / Replace"
            tab="home"
            className={styles.groupFind}
          >
            <div className={styles.toolbarGroup}>
              <input
                type="text"
                className={styles.toolbarInput}
                value={findText}
                onChange={(event) => setFindText(event.target.value)}
                placeholder="Find text"
              />

              <input
                type="text"
                className={styles.toolbarInput}
                value={replaceText}
                onChange={(event) => setReplaceText(event.target.value)}
                placeholder="Replace with"
              />

              <button
                type="button"
                onClick={findAndReplaceText}
                disabled={!findText.trim()}
                title="Replace All"
              >
                <Search />
                Replace All
              </button>
            </div>
          </RibbonGroup>

          {enableUniversityTools && (
            <RibbonGroup
              title="Academic Tools"
              tab="academic"
              className={styles.groupAcademic}
            >
              <div className={styles.toolbarGroup}>
                <select
                  className={styles.toolbarSelect}
                  defaultValue=""
                  onChange={(event) => {
                    handleAcademicTemplateSelect(event.target.value);
                    event.target.value = '';
                  }}
                  title="Insert Academic Template"
                >
                  <option value="" disabled>
                    Insert Template
                  </option>

                  {academicTemplateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {courseOutcomes.length > 0 && (
                  <>
                    <span className={styles.groupContextLabel}>
                      <GraduationCap />
                      COs:
                    </span>

                    {courseOutcomes.map((co) => (
                      <button
                        key={co.id}
                        type="button"
                        className={styles.tagBadgeButton}
                        onClick={() => injectUniversityTag('co', co.code)}
                        title={`Map to ${co.title || co.code}`}
                      >
                        <GraduationCap />
                        {co.code}
                      </button>
                    ))}
                  </>
                )}

                {skillTags.length > 0 && (
                  <>
                    <span className={styles.groupContextLabel}>
                      <Tags />
                      Skills:
                    </span>

                    {skillTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={styles.tagBadgeButton}
                        onClick={() => injectUniversityTag('skill', tag)}
                        title={`Map to ${tag}`}
                      >
                        <GraduationCap />
                        {tag}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </RibbonGroup>
          )}

          {enableAiTools && (
            <RibbonGroup
              title="AI Academic Flow"
              tab="ai"
              className={styles.groupAi}
            >
              <div className={styles.toolbarGroup}>
                <span className={styles.groupContextLabel}>
                  <Bot />
                  AI:
                </span>

                {aiActionOptions.map((option) => (
                  <button
                    key={option.action}
                    type="button"
                    className={styles.aiCoreTrigger}
                    onClick={() => runAiAction(option.action)}
                    disabled={isAiRunning}
                    title={option.label}
                  >
                    {renderAiIcon(option.icon)}
                    {isAiRunning ? 'Processing...' : option.label}
                  </button>
                ))}
              </div>
            </RibbonGroup>
          )}
            </div>
          </section>
        </div>

        <div
          className={styles.workspaceArea}
          style={workspaceAreaRuntimeStyle}
        >
          {showPreview && (
          <div className={styles.workspaceHeader}>
            <div className={styles.modeSwitch}>
              <button
                type="button"
                className={editorMode === 'write' ? styles.modeButtonActive : ''}
                onClick={() => setEditorMode('write')}
              >
                Editor Workspace
              </button>

              <button
                type="button"
                className={editorMode === 'split' ? styles.modeButtonActive : ''}
                onClick={() => setEditorMode('split')}
              >
                Split Preview
              </button>

              <button
                type="button"
                className={editorMode === 'preview' ? styles.modeButtonActive : ''}
                onClick={() => setEditorMode('preview')}
              >
                Production View
              </button>





  <button
    type="button"
    className={styles.neomorphicMiniButton}
    onClick={handleSyllabusDraftSave}
    title="Save syllabus draft"
  >
    <Save size={14} />
    <span>Save Draft</span>
  </button>

  <button
    type="button"
    className={styles.neomorphicMiniButton}
    onClick={handleSyllabusSaveAndConfirm}
    title="Save and confirm syllabus"
  >
    <CheckCircle2 size={14} />
    <span>Save & Confirm</span>
  </button>

  
                <button
    type="button"
    className={styles.neomorphicMiniButton}
    onClick={handleEditorClose}
    title="Close editor and return"
  >
    <span>Close</span>
  </button>




              {editorMode === 'preview' && (
                <button
                  type="button"
                  className={styles.neomorphicMiniButton}
                  onClick={openProductionFullscreen}
                  title="Open production view in full screen"
                >
                  <Maximize2 size={14} />
                  <span>View Full Screen</span>
                </button>
              )}

              {editorMode === 'split' && (
                <button
                  type="button"
                  className={styles.neomorphicMiniButton}
                  onClick={() => setIsSplitSidebarHidden((current) => !current)}
                  title={isSplitSideBarHidden ? 'Show side tools' : 'Hide side tools'}
                  aria-pressed={isSplitSideBarHidden}
                >
                  <PanelTop size={14} />
                  <span>{isSplitSideBarHidden ? 'Show Tools' : 'Hide Tools'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {selectionPaneOpen && (
          <div className="layoutSelectionPane" aria-label="Layout selection pane">
            <div className="layoutSelectionPaneHeader">
              <strong>Selection Pane</strong>
              <button type="button" onClick={() => setSelectionPaneOpen(false)} aria-label="Close selection pane">×</button>
            </div>
            <div className="layoutSelectionPaneBody">
              <button type="button" onClick={() => editor?.chain().focus().selectAll().run()}>
                Whole Document
              </button>
              <button type="button" onClick={() => editor?.chain().focus().selectParentNode().run()}>
                Current Block
              </button>
              <button type="button" onClick={() => editor?.chain().focus().setTextSelection(editor.state.selection.from).run()}>
                Current Cursor Position
              </button>
              <p>Use this pane to select the document, current block, or cursor object before applying layout arrangement.</p>
            </div>
          </div>
        )}

        {showNotesPanel && (
          <div className="footnoteNotesPane" aria-label="Footnotes and endnotes pane">
            <div className="footnoteNotesPaneHeader">
              <strong>Notes</strong>
              <button type="button" onClick={() => setShowNotesPanel(false)} aria-label="Close notes pane">×</button>
            </div>
            <div className="footnoteNotesPaneBody">
              {editorFootnotes.length === 0 ? (
                <p>No footnotes or endnotes inserted yet.</p>
              ) : (
                editorFootnotes.map((note, index) => {
                  const marker = formatFootnoteMarker(note.number, footnoteSettings.numberFormat);

                  return (
                    <button
                      key={note.id}
                      type="button"
                      className={index === activeFootnoteIndex ? 'footnoteNoteActive' : ''}
                      onClick={() => {
                        const target = document.querySelector<HTMLElement>(`[data-note-ref="${note.id}"], [data-note-item="${note.id}"]`);
                        setActiveFootnoteIndex(index);
                        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                    >
                      <span>{note.type === 'footnote' ? 'Footnote' : 'Endnote'} {marker}</span>
                      <strong>{note.text}</strong>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        <div
          className={`${styles.editorBody} ${
            editorMode === 'split' ? styles.editorBodySplit : ''
          }`}
          style={editorBodyRuntimeStyle}
          data-split-sidebar-hidden={isSplitSideBarHidden ? 'true' : 'false'}
          data-production-preview={isProductionPreviewMode ? 'true' : 'false'}
        >
          {showWritePanel && (
            <div
              className={styles.writePanel}
              style={
                isProductionPreviewMode
                  ? {
                      position: 'absolute',
                      width: 1,
                      height: 1,
                      minWidth: 1,
                      minHeight: 1,
                      maxWidth: 1,
                      maxHeight: 1,
                      padding: 0,
                      margin: 0,
                      opacity: 0,
                      overflow: 'hidden',
                      pointerEvents: 'none',
                    }
                  : splitScrollablePanelStyle
              }
              data-independent-scroll={editorMode === 'split' ? 'editor' : undefined}
              data-production-hidden={isProductionPreviewMode ? 'true' : undefined}
              aria-hidden={isProductionPreviewMode ? 'true' : undefined}
              aria-label="Editable document area"
            >
              <EditorContent
                editor={editor}
                className={styles.editorContent}
                style={documentCanvasStyle}
                data-layout-view={pageViewMode}
                data-layout-margin={pageMargin}
                data-layout-orientation={pageOrientation}
                data-layout-size={pageSize}
                data-layout-columns={columnPreset}
                data-line-numbers={lineNumbers ? 'true' : 'false'}
                data-hyphenation={hyphenation ? 'true' : 'false'}
              />
            </div>
          )}

          {showPreviewPanel && (
            <div
              className={styles.previewPanel}
              style={splitScrollablePanelStyle}
              data-independent-scroll={editorMode === 'split' ? 'preview' : undefined}
              aria-label="Live document preview area"
            >
              <div className={styles.previewTitle}>
                <Eye size={14} />
                Live Compiled Document Output
              </div>

              <div
                className={styles.previewContent}
                style={previewCanvasStyle}
                data-layout-view={pageViewMode}
                data-layout-margin={pageMargin}
                data-layout-orientation={pageOrientation}
                data-layout-size={pageSize}
                data-layout-columns={columnPreset}
                data-line-numbers={lineNumbers ? 'true' : 'false'}
                data-hyphenation={hyphenation ? 'true' : 'false'}
                data-production-view={isProductionPreviewMode ? 'true' : undefined}
                dangerouslySetInnerHTML={{
                  __html: pagedPreviewHtml,
                }}
              />
            </div>
          )}
        </div>
        </div>
      </div>

      {isProductionFullscreen && (
        <div
          className={styles.productionFullscreenOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Production full screen document view"
        >
          <button
            type="button"
            className={styles.productionFullscreenExit}
            onClick={closeProductionFullscreen}
            title="Exit production full screen view"
          >
            <Minimize2 size={15} />
            <span>Exit</span>
          </button>

          <div className={styles.productionFullscreenScroller}>
            <div
              className={styles.productionFullscreenDocument}
              data-line-numbers={lineNumbers ? 'true' : 'false'}
              dangerouslySetInnerHTML={{
                __html: pagedPreviewHtml,
              }}
            />
          </div>
        </div>
      )}

      {isEquationDialogOpen && renderEquationDialog()}
      {isOnlineVideoDialogOpen && renderOnlineVideoDialog()}
      {renderSignaturePromptModal()}
      {renderFootnoteSettingsDialog()}
      {isSmartArtChooserOpen && renderSmartArtChooser()}
      {isChartChooserOpen && renderChartChooser()}

      {(enableVersionHistory || enableComments || enableApprovalRemarks) && (
        <div className={styles.universityPanelGrid}>
          {enableVersionHistory && (
            <section className={styles.sidePanel}>
              <h4>
                <History size={16} />
                Document Snapshots
              </h4>

              <div className={styles.commentComposer}>
                <button
                  type="button"
                  onClick={createManualSnapshot}
                >
                  Capture Active State
                </button>
              </div>

              {versions.length === 0 ? (
                <p>No saved snapshots recorded yet.</p>
              ) : (
                <div className={styles.versionList}>
                  {versions.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => restoreSnapshot(v)}
                    >
                      <strong>{v.title}</strong>
                      <span>{new Date(v.created_at).toLocaleTimeString()}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {enableComments && (
            <section className={styles.sidePanel}>
              <h4>
                <MessageSquare size={16} />
                Editorial Comments
              </h4>

              <div className={styles.commentComposer}>
                <input
                  type="text"
                  value={commentText}
                  placeholder="Add document review note..."
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                />

                <button
                  type="button"
                  onClick={handleAddComment}
                >
                  Post
                </button>
              </div>

              {comments.length === 0 ? (
                <p>No notes posted.</p>
              ) : (
                <div className={styles.commentList}>
                  {comments.map((c) => (
                    <div key={c.id}>
                      <p>{c.text}</p>
                      <span>{new Date(c.created_at).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {enableApprovalRemarks && (
            <section className={styles.sidePanel}>
              <h4>
                <CheckCircle2 size={16} />
                Authority Remarks
              </h4>

              <textarea
                value={approvalRemark}
                placeholder="Specify final approval conditions or rejection review notes here..."
                onChange={(e) => {
                  setApprovalRemark(e.target.value);
                  onApprovalRemarkChange?.(e.target.value);
                }}
              />
            </section>
          )}
        </div>
      )}

      {maxLength && (
        <p className={styles.limitText}>
          {editorStats.characters} / {maxLength} characters filled
        </p>
      )}

      {helpText && !error && (
        <p className={styles.helpText}>
          {helpText}
        </p>
      )}

      {error && (
        <p className={styles.errorText}>
          {error}
        </p>
      )}
    </div>
  );
}
