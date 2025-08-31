<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use Illuminate\Database\Seeder;

class IngredientSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            ['name' => 'Tomatoes', 'unit' => 'kg', 'cost_per_unit' => 2.35, 'notes' => 'Roma'],
            ['name' => 'Olive Oil', 'unit' => 'L', 'cost_per_unit' => 7.60, 'notes' => 'Extra virgin'],
            ['name' => 'Flour', 'unit' => 'kg', 'cost_per_unit' => 1.28, 'notes' => '00 Pizza'],
            ['name' => 'Sugar', 'unit' => 'kg', 'cost_per_unit' => 1.06],
            ['name' => 'Butter', 'unit' => 'kg', 'cost_per_unit' => 6.80],
            ['name' => 'Yeast', 'unit' => 'g', 'cost_per_unit' => 0.02],
            ['name' => 'Salt', 'unit' => 'kg', 'cost_per_unit' => 0.90],
        ];

        foreach ($data as $row) {
            Ingredient::query()->firstOrCreate(
                ['name' => $row['name']],
                $row
            );
        }
    }
}
