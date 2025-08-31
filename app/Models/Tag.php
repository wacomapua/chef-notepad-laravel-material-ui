<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tag extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'colour',
    ];

    public function ingredients()
    {
        return $this->belongsToMany(Ingredient::class)->withTimestamps();
    }
}

