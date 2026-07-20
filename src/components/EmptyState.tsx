import React from "react";
import { FileSearch } from "lucide-react";
import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  title: string;
  description: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description }) => {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIconWrapper}>
        <FileSearch size={64} color="#cbd5e1" strokeWidth={1} />
      </div>
      <h3 className={styles.emptyStateTitle}>{title}</h3>
      <p className={styles.emptyStateDesc}>{description}</p>
    </div>
  );
};
