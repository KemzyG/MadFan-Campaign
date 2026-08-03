<x-filament-panels::page>
    @if ($this->getHeaderWidgets())
        <x-filament-widgets::widgets
            :columns="$this->getHeaderWidgetsColumns()"
            :data="$this->getWidgetData()"
            :widgets="$this->getVisibleHeaderWidgets()"
            class="fi-page-header-widgets"
        />
    @endif

    @if ($this->getFooterWidgets())
        <x-filament-widgets::widgets
            :columns="$this->getFooterWidgetsColumns()"
            :data="$this->getWidgetData()"
            :widgets="$this->getVisibleFooterWidgets()"
            class="mt-6 fi-page-footer-widgets"
        />
    @endif
</x-filament-panels::page>
