<?php

Schedule::command('leaderboard:rebuild')
    ->hourly();

Schedule::command('streaks:expire')
    ->daily();

Schedule::command('tasks:weekly-reset')
    ->weekly();
