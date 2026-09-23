import { motion } from 'framer-motion'
import './Button.css'

/**
 * 공용 Button 컴포넌트
 * @param {'primary'|'secondary'|'ghost'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} loading
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  ...props
}) {
  return (
    <motion.button
      className={`btn btn--${variant} btn--${size} ${loading ? 'btn--loading' : ''} ${className}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      <span className={loading ? 'btn__label--hidden' : ''}>{children}</span>
    </motion.button>
  )
}
