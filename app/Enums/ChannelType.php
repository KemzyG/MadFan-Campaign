<?php

namespace App\Enums;

enum ChannelType: string
{
    case Text = 'text';
    case Announcement = 'announcement';
    case VoicePlaceholder = 'voice_placeholder';
}
