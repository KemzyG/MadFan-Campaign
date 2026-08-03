<?php

namespace App;

enum AuthProvider: string
{
    case Password = 'password';
    case Firebase = 'firebase';
    case Google = 'google';
}
