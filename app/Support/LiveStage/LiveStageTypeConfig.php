<?php

namespace App\Support\LiveStage;

use App\Enums\LiveStageType;

/**
 * The capability matrix a LiveStageType controls — host controls, viewer
 * layout, default interaction toggles. This is the single place "what does
 * a Creator stage look like vs. a Gaming stream" is decided; controllers,
 * the frontend page router, and the create form all read from here instead
 * of scattering `if ($type === ...)` checks through the codebase.
 *
 * Adding a fifth stage type later: add the enum case, add its match arm here,
 * build its Studio/Viewer React renderer. Nothing else in this file changes.
 *
 * Only Creator ships this phase — the others return a real, considered
 * config (so the match stays exhaustive and the shape is proven out) but
 * have no renderer yet; LiveStageType doc-comments this explicitly.
 *
 * @phpstan-type StageTypeConfig array{
 *     label: string,
 *     primary_source: string,
 *     viewer_layout: string,
 *     host_controls: list<string>,
 *     allow_camera_overlay: bool,
 *     default_allow_comments: bool,
 *     default_allow_reactions: bool,
 * }
 */
class LiveStageTypeConfig
{
    /**
     * @return StageTypeConfig
     */
    public static function for(LiveStageType $type): array
    {
        return match ($type) {
            LiveStageType::Creator => [
                'label' => 'Creator Live',
                'primary_source' => 'camera',
                // Full-bleed video, chrome floats over it — TikTok/Instagram Live.
                'viewer_layout' => 'immersive',
                'host_controls' => ['camera', 'microphone', 'comments', 'reactions', 'moderation', 'invite'],
                'allow_camera_overlay' => false,
                'default_allow_comments' => true,
                'default_allow_reactions' => true,
            ],
            LiveStageType::Gaming => [
                'label' => 'Gaming Live',
                'primary_source' => 'screen',
                // Video dominant, chat docked beside it — Twitch-style.
                'viewer_layout' => 'theater',
                'host_controls' => ['screen', 'camera', 'microphone', 'comments', 'reactions', 'moderation', 'invite'],
                'allow_camera_overlay' => true,
                'default_allow_comments' => true,
                'default_allow_reactions' => true,
            ],
            LiveStageType::Movie => [
                'label' => 'Movie Live',
                'primary_source' => 'media',
                // Cinematic: media fills the frame, chat is a collapsible strip.
                'viewer_layout' => 'cinematic',
                'host_controls' => ['playback', 'microphone', 'comments', 'reactions', 'moderation', 'invite'],
                'allow_camera_overlay' => false,
                'default_allow_comments' => true,
                'default_allow_reactions' => true,
            ],
            LiveStageType::Presenter => [
                'label' => 'Presenter Live',
                'primary_source' => 'screen_presentation',
                // Presentation dominant, presenter camera as a small PiP.
                'viewer_layout' => 'presentation',
                'host_controls' => ['screen', 'camera', 'microphone', 'comments', 'reactions', 'moderation', 'invite'],
                'allow_camera_overlay' => true,
                'default_allow_comments' => true,
                'default_allow_reactions' => true,
            ],
        };
    }

    /**
     * Types with a shipped Studio/Viewer renderer — gates stage creation so
     * the API never hands back a type the frontend can't render yet.
     *
     * @return list<LiveStageType>
     */
    public static function implemented(): array
    {
        return [LiveStageType::Creator];
    }

    public static function isImplemented(LiveStageType $type): bool
    {
        return in_array($type, self::implemented(), true);
    }
}
