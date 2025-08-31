<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ingredient extends Model
{
    protected $fillable = [
        'name',
        'unit',
        'cost_per_unit',
        'notes',
    ];

    public function tags()
    {
        return $this->belongsToMany(Tag::class)->withTimestamps();
    }
}

