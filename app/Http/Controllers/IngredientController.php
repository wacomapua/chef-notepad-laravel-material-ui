<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class IngredientController extends Controller
{
    public function index(): Response
    {
        $ingredients = Ingredient::query()
            ->with(['tags:id,name,colour'])
            ->select(['id', 'name', 'unit', 'cost_per_unit'])
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('ingredients/index', [
            'ingredients' => $ingredients,
        ]);
    }

    public function show(Ingredient $ingredient): Response
    {
        return Inertia::render('ingredients/show', [
            'ingredient' => $ingredient,
        ]);
    }

    // Sync tags for an ingredient. Accepts an array of tag names.
    public function updateTags(Request $request, Ingredient $ingredient)
    {
        $data = $request->validate([
            'tags' => ['array'],
            'tags.*' => ['nullable'], // allow string or object
        ]);

        $parsed = collect($data['tags'] ?? [])
            ->map(function ($it) {
                if (is_string($it)) {
                    return ['name' => trim($it), 'colour' => null];
                }
                if (is_array($it)) {
                    $name = trim((string) ($it['name'] ?? ''));
                    $colour = isset($it['colour']) ? (string) $it['colour'] : null;
                    return ['name' => $name, 'colour' => $colour];
                }
                return null;
            })
            ->filter(fn ($it) => $it && $it['name'] !== '')
            ->unique('name');

        $tagIds = $parsed->map(function (array $item) {
            $slug = Str::slug($item['name']);
            $tag = Tag::firstOrCreate(['slug' => $slug], ['name' => $item['name'], 'colour' => $item['colour'] ?? null]);
            if (array_key_exists('colour', $item) && $item['colour'] !== null) {
                $tag->colour = $item['colour'];
                $tag->save();
            }
            return $tag->id;
        })->values()->all();

        $ingredient->tags()->sync($tagIds);

        $fresh = $ingredient->load(['tags:id,name,colour']);

        return response()->json([
            'ok' => true,
            'tags' => $fresh->tags->map(fn ($t) => ['id' => $t->id, 'name' => $t->name, 'colour' => $t->colour])->values(),
        ]);
    }
}

