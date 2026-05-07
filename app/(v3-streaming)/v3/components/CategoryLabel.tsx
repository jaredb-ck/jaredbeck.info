import styles from '../v3.module.css'

interface CategoryLabelProps {
  label: string
}

export default function CategoryLabel({ label }: CategoryLabelProps) {
  return <span className={styles.categoryLabel}>{label}</span>
}
