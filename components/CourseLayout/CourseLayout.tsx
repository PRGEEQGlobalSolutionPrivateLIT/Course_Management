"use client";


import CourseSidebar from "../CourseSidebar/CourseSidebar";

import CourseHeader from "../CourseHeader/CourseHeader";

import styles from "./CourseLayout.module.css";



interface Props {

    children: React.ReactNode;

}



export default function CourseLayout({
    children
}: Props){


return(


<div className={styles.wrapper}>


    <CourseSidebar />



    <div className={styles.main}>


        <CourseHeader />



        <main className={styles.content}>

            {children}

        </main>



    </div>


</div>


)


}