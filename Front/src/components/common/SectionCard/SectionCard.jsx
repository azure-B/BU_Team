import './SectionCard.css'

export default function SectionCard({ children, className = '', ...props }) {
  return (
    <article className={`section-card ${className}`.trim()} {...props}>
      {children}
    </article>
  )
}
