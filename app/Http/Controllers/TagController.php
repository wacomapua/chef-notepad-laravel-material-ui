<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TagController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $tags = Tag::query()
            ->when($q !== '', function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%");
            })
            ->orderBy('name')
            ->get(['id', 'name', 'colour']);

        return response()->json(['data' => $tags]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50'],
            'colour' => ['nullable', 'string', 'max:20'],
        ]);

        $name = trim($validated['name']);
        $slug = Str::slug($name);

        $tag = Tag::firstOrCreate(['slug' => $slug], [
            'name' => $name,
            'colour' => $validated['colour'] ?? null,
        ]);

        // Update colour if provided and tag exists without colour change request
        if (array_key_exists('colour', $validated)) {
            $tag->colour = $validated['colour'];
            $tag->save();
        }

        return response()->json(['data' => ['id' => $tag->id, 'name' => $tag->name, 'colour' => $tag->colour]]);
    }
}
