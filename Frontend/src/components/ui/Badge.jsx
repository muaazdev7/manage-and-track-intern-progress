/**
 * Maps the app's tones onto Nocturne's .tag-* classes.
 *
 * The design differentiates state largely by accent lightness; success and
 * danger keep a hue of their own here so an approved task and a rejected
 * one are never the same colour.
 */
const tones = {
  slate: 'tag-neutral',
  neutral: 'tag-neutral',
  blue: 'tag-accent-2',
  brand: 'tag-accent',
  amber: 'tag-outline',
  emerald: 'tag-success',
  red: 'tag-danger',
};

const Badge = ({ children, tone = 'slate', dot = false, className = '' }) => (
  <span className={['tag', tones[tone] ?? tones.slate, className].join(' ')}>
    {dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />}
    {children}
  </span>
);

export default Badge;
