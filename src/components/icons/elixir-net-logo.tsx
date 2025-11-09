import { FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ElixirNetLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 font-bold text-primary", className)}>
      <FlaskConical className="h-7 w-7" />
      <span className="text-xl font-headline">ElixirNet</span>
    </div>
  )
}
