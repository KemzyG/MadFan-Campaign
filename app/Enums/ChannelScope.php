<?php

namespace App\Enums;

enum ChannelScope: string
{
    // Legacy — favourite_club_id is no longer set during onboarding, so no
    // new Club-scoped channel gets created after this (see
    // EnsureClubChatRooms); existing ones keep working for whoever already
    // has a club. Fandom is the replacement — see EnsureFandomChatRoom.
    case Club = 'club';
    case Fandom = 'fandom';
    case Direct = 'direct';
    case Group = 'group';
}
