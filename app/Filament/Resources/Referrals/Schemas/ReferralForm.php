<?php

namespace App\Filament\Resources\Referrals\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class ReferralForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Referrer & Referee')
                    ->description('Details of the referrer and referee.')
                    ->schema([
                        Select::make('referrer_user_id')
                            ->relationship('referrer', 'name')
                            ->required()
                            ->searchable()
                            ->preload(),
                        Select::make('referred_user_id')
                            ->relationship('referred', 'name')
                            ->searchable()
                            ->preload()
                            ->placeholder('None (not registered yet)'),
                        TextInput::make('referred_email')
                            ->email()
                            ->required()
                            ->maxLength(255),
                        TextInput::make('referred_user_handle')
                            ->maxLength(100),
                    ])
                    ->columns(2),

                Section::make('Status & Reward')
                    ->description('Referral code, progress status, and points awarded.')
                    ->schema([
                        TextInput::make('referral_code')
                            ->required()
                            ->maxLength(50),
                        Select::make('status')
                            ->options([
                                'pending' => 'Pending',
                                'active' => 'Active',
                                'rejected' => 'Rejected',
                                'rewarded' => 'Rewarded',
                            ])
                            ->required()
                            ->default('pending'),
                        TextInput::make('points_awarded')
                            ->numeric()
                            ->default(0)
                            ->required(),
                        Select::make('point_transaction_id')
                            ->relationship('pointTransaction', 'id')
                            ->placeholder('No transaction yet')
                            ->disabled(),
                        DateTimePicker::make('activated_at'),
                        DateTimePicker::make('rewarded_at'),
                    ])
                    ->columns(2),
            ]);
    }
}
