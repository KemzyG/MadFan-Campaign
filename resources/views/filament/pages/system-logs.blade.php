<x-filament-panels::page>
    <div class="flex flex-col rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl">
        <!-- Terminal Header -->
        <div class="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 select-none">
            <div class="flex space-x-2">
                <span class="w-3.5 h-3.5 rounded-full bg-rose-500 opacity-80"></span>
                <span class="w-3.5 h-3.5 rounded-full bg-amber-500 opacity-80"></span>
                <span class="w-3.5 h-3.5 rounded-full bg-emerald-500 opacity-80"></span>
            </div>
            <div class="text-xs font-mono text-slate-400 font-bold">
                laravel.log
            </div>
            <div class="w-12"></div> <!-- Spacer to align center -->
        </div>

        <!-- Terminal Body -->
        <div class="p-6 overflow-y-auto max-h-[600px] font-mono text-sm leading-relaxed text-slate-300 antialiased selection:bg-amber-500 selection:text-slate-950">
            @if(empty($logContent))
                <div class="text-center py-12 text-slate-500 italic">
                    Log file is currently empty or no events logged.
                </div>
            @else
                <pre class="whitespace-pre-wrap break-all select-text font-mono text-xs md:text-sm bg-slate-950 p-4 rounded-lg border border-slate-800 shadow-inner leading-normal">{{ $logContent }}</pre>
            @endif
        </div>
    </div>
</x-filament-panels::page>
