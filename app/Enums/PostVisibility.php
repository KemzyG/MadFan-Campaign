<?php

namespace App\Enums;

enum PostVisibility: string
{
    case Public = 'public';
    // Legacy — no longer offered in the composer (see VisibilityMenu.jsx),
    // kept only so posts made before the fandom move stay visible to
    // whoever they were originally scoped to.
    case Club = 'club';
    case Fandom = 'fandom';
    case OnlyMe = 'only_me';
}
