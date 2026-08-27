<?php

namespace App\Enums;

/**
 * Stage format. Each case determines host controls, viewer layout, and which
 * media tracks matter — see LiveStageTypeConfig for the capability matrix.
 *
 * Only Creator is implemented in this phase. The remaining cases are reserved
 * so the schema/enum never needs a breaking migration when Gaming, Movie, and
 * Presenter are built — adding one is: add the case, add its config() branch,
 * add its Studio/Viewer React renderer. No rewrite of the shared plumbing.
 */
enum LiveStageType: string
{
    case Creator = 'creator';
    case Gaming = 'gaming';
    case Movie = 'movie';
    case Presenter = 'presenter';
}
