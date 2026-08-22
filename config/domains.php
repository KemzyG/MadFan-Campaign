<?php

/**
 * Optional campaign / social hosts.
 *
 * Leave CAMPAIGN_DOMAIN and SOCIAL_DOMAIN empty for single-host mode
 * (current Render default: everything on APP_URL, social under /social).
 *
 * When set (host only, no scheme), routes are domain-scoped:
 * - campaign.{root} → landing, marketing, fan dashboard / auth
 * - social.{root}  → social app at / (legacy /social/* still accepted)
 *
 * APP_DOMAIN is the apex/www host that 301s to the campaign host when both
 * APP_DOMAIN and CAMPAIGN_DOMAIN are configured.
 */
return [

    /*
    |--------------------------------------------------------------------------
    | Apex / root domain
    |--------------------------------------------------------------------------
    |
    | Host only, e.g. madfan.com or madfan.test. When set with CAMPAIGN_DOMAIN,
    | requests to the apex (and www.{APP_DOMAIN}) redirect to the campaign host.
    |
    */
    'root' => env('APP_DOMAIN') ?: null,

    /*
    |--------------------------------------------------------------------------
    | Campaign host
    |--------------------------------------------------------------------------
    |
    | Host only, e.g. campaign.madfan.com. Empty = campaign/fan routes on APP_URL.
    |
    */
    'campaign' => env('CAMPAIGN_DOMAIN') ?: null,

    /*
    |--------------------------------------------------------------------------
    | Social host
    |--------------------------------------------------------------------------
    |
    | Host only, e.g. social.madfan.com. Empty = social stays on /social path
    | (single-host / Render-friendly fallback).
    |
    */
    'social' => env('SOCIAL_DOMAIN') ?: null,

];
