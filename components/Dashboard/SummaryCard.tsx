import styles from "./SummaryCard.module.css";


export default function SummaryCard({data}:any){

return(

<div className={styles.card}>


<h3>
{data.title}
</h3>


<strong>
{data.value}
</strong>


</div>

)

}