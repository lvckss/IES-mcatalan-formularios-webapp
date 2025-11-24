import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ExternalLink } from "lucide-react"

import pp from '@/assets/pp.png'

const SidebarAvatar: React.FC = () => {
    return (
        <div
            className="
                    inline-flex items-center gap-2 px-3 py-2
                    rounded-2xl border border-gray-300 dark:border-gray-700
                    bg-white dark:bg-neutral-900
                    shadow-sm
                    mx-3
                    opacity-80
                "
        >
            <span className="text-sm text-muted-foreground">
                Software desarrollado y desplegado por lvcks
            </span>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className="inline-flex items-center justify-center rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label="Ver información de contacto"
                        >
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={pp} alt="lvcks" />
                            </Avatar>
                        </button>
                    </TooltipTrigger>

                    <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-1 text-sm">
                            <p>
                                <span className="font-medium">Email:</span>{" "}
                                <a
                                    href="mailto:lgarcirz@gmail.com"
                                    className="inline-flex items-center gap-1 underline hover:decoration-solid hover:text-green-300 transition-colors"
                                >
                                    lgarcirz@gmail.com
                                </a>
                                <ExternalLink className="ml-1 inline-block h-3 w-3 align-middle" />
                            </p>
                            <p>
                                <span className="font-medium">GitHub:</span>{" "}
                                <a
                                    href="https://github.com/lvckss"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 underline hover:decoration-solid hover:text-green-300 transition-colors"
                                >
                                    github.com/lvckss
                                </a>
                                <ExternalLink className="ml-1 inline-block h-3 w-3 align-middle" />
                            </p>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}
export default SidebarAvatar