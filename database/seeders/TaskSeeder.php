<?php

namespace Database\Seeders;

use App\Models\Season;
use App\Models\Task;
use Illuminate\Database\Seeder;

class TaskSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $season = Season::where('status', 'active')->first();

        if (! $season) {
            return;
        }

        $seasonWeeks = $season->seasonWeeks()->orderBy('week_number')->get();

        $tasksData = [
            [
                'code' => 'TASK_FOLLOW_X',
                'name' => 'Follow on X (Twitter)',
                'description' => 'Follow our official X account and share the love!',
                'points' => 25,
                'platform' => 'x',
                'task_type' => 'social_follow',
                'external_url' => 'https://twitter.com/madfan',
                'verification_required' => true,
                'display_order' => 1,
                'steps' => [
                    [
                        'step_number' => 1,
                        'description' => 'Visit our X profile',
                        'link_url' => 'https://twitter.com/madfan',
                        'link_label' => 'Go to X Profile',
                    ],
                    [
                        'step_number' => 2,
                        'description' => 'Click the follow button',
                        'link_url' => null,
                        'link_label' => null,
                    ],
                    [
                        'step_number' => 3,
                        'description' => 'Verify your follow with proof',
                        'link_url' => null,
                        'link_label' => null,
                    ],
                ],
            ],
            [
                'code' => 'TASK_JOIN_DISCORD',
                'name' => 'Join Discord Community',
                'description' => 'Join our Discord server and introduce yourself!',
                'points' => 30,
                'platform' => 'discord',
                'task_type' => 'join_server',
                'external_url' => 'https://discord.gg/madfan',
                'verification_required' => true,
                'display_order' => 2,
                'steps' => [
                    [
                        'step_number' => 1,
                        'description' => 'Click the Discord link',
                        'link_url' => 'https://discord.gg/madfan',
                        'link_label' => 'Join Discord',
                    ],
                    [
                        'step_number' => 2,
                        'description' => 'Accept the server invite',
                        'link_url' => null,
                        'link_label' => null,
                    ],
                ],
            ],
            [
                'code' => 'TASK_SUBSCRIBE_TELEGRAM',
                'name' => 'Subscribe to Telegram',
                'description' => 'Join our Telegram channel for exclusive updates',
                'points' => 20,
                'platform' => 'telegram',
                'task_type' => 'join_channel',
                'external_url' => 'https://t.me/madfan',
                'verification_required' => true,
                'display_order' => 3,
                'steps' => null,
            ],
            [
                'code' => 'TASK_SHARE_SOCIAL',
                'name' => 'Share on Social Media',
                'description' => 'Share Mad Fan on your social media and earn points!',
                'points' => 15,
                'platform' => 'general',
                'task_type' => 'share',
                'external_url' => null,
                'verification_required' => false,
                'display_order' => 4,
                'steps' => null,
            ],
            [
                'code' => 'TASK_COMMENT_POSTS',
                'name' => 'Comment on Posts',
                'description' => 'Engage with our community by commenting on posts',
                'points' => 10,
                'platform' => 'general',
                'task_type' => 'engagement',
                'external_url' => null,
                'verification_required' => false,
                'display_order' => 5,
                'steps' => null,
            ],
            [
                'code' => 'TASK_PARTICIPATE_POLLS',
                'name' => 'Participate in Polls',
                'description' => 'Vote and participate in our community polls',
                'points' => 5,
                'platform' => 'general',
                'task_type' => 'poll',
                'external_url' => null,
                'verification_required' => false,
                'display_order' => 6,
                'steps' => null,
            ],
            [
                'code' => 'TASK_REFER_FRIEND',
                'name' => 'Refer a Friend',
                'description' => 'Invite a friend to join Mad Fan community',
                'points' => 100,
                'platform' => 'general',
                'task_type' => 'referral',
                'external_url' => null,
                'verification_required' => true,
                'display_order' => 7,
                'steps' => null,
            ],
            [
                'code' => 'TASK_WEEKLY_CHALLENGE',
                'name' => 'Complete Weekly Challenge',
                'description' => 'Finish all weekly challenges for bonus points',
                'points' => 50,
                'platform' => 'general',
                'task_type' => 'challenge',
                'external_url' => null,
                'verification_required' => false,
                'display_order' => 8,
                'steps' => null,
            ],
        ];

        foreach ($tasksData as $index => $taskData) {
            $steps = $taskData['steps'] ?? null;
            unset($taskData['steps']);

            $task = Task::updateOrCreate(
                ['code' => $taskData['code']],
                [
                    ...$taskData,
                    'season_id' => $season->id,
                    'season_week_id' => $seasonWeeks[$index % $seasonWeeks->count()]->id,
                    'is_active' => true,
                    // Every fan challenge needs a close date so it drops off
                    // the Events feed on its own — default to the season's.
                    'ends_at' => $taskData['ends_at'] ?? $season->ends_at,
                ]
            );

            if ($steps) {
                $task->taskSteps()->delete();
                foreach ($steps as $step) {
                    $task->taskSteps()->create($step);
                }
            }
        }
    }
}
