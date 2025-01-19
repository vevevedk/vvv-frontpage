import React, { useState, useEffect } from "react";
import { CustomerCasesData } from "../model/CustomerCasesModel";
import styles from "../../styles/CustomerCasesStyle.module.css";

const MyComponent: React.FC = () => {
 const [cases, setCases] = useState<CustomerCasesData[]>([]);
 const [isLoading, setIsLoading] = useState(true);

 useEffect(() => {
   const fetchData = async () => {
     try {
       const response = await fetch("/api/CustomerCasesData");
       
       if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
       }
       
       const data = await response.json();
       
       // Log received data for debugging
       console.log("Received data:", data);
       
       // More robust array extraction
       const casesArray = Array.isArray(data) 
         ? data 
         : (data.data ?? data.cases ?? []);
       
       setCases(casesArray);
       setIsLoading(false);
     } catch (error) {
       console.error("Fetch error:", error);
       setIsLoading(false);
     }
   };

   fetchData();
 }, []);

 if (isLoading) {
   return <div>Loading references...</div>;
 }

 if (cases.length === 0) {
   return <div>No references found</div>;
 }

 return (
   <div id="cases" className={styles.cases_section}>
     <div className={styles.cases_container}>
       {cases.map((service) => (
         <div key={service.id} className={styles.case}>
           <img 
             src={service.img} 
             alt={service.title} 
             className={styles.case_image}
           />
           <h3 className={styles.case_title}>{service.title}</h3>
           <div className={styles.case_stats}>
             {service.stats.map((stat) => (
               <div key={stat} className={styles.case_stat}>
                 {stat}
               </div>
             ))}
           </div>
         </div>
       ))}
     </div>
   </div>
 );
};

export default MyComponent;