import styles from "./ModuleCard.module.css";


export default function ModuleCard({data}:any){


return(

<div className={styles.card}>


<h3>
{data.title}
</h3>


<p>
{data.description}
</p>


</div>

)

}