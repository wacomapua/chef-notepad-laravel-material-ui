<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\IngredientController;
use App\Models\Ingredient;
use App\Http\Controllers\TagController;

Route::get('/', function () {
    return redirect()->route('dashboard');
})->name('home');

Route::get('dashboard', function () {
    $ingredients = Ingredient::query()
        ->select(['id', 'name', 'unit', 'cost_per_unit'])
        ->orderBy('name')
        ->get();

    return Inertia::render('dashboard', [
        'ingredients' => $ingredients,
    ]);
})->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    // other authenticated routes remain here
});

Route::resource('ingredients', IngredientController::class)
    ->only(['index', 'show']);

// Inline tags editing API
Route::patch('ingredients/{ingredient}/tags', [IngredientController::class, 'updateTags'])
    ->name('ingredients.tags.update');

// Tags API
Route::get('tags', [TagController::class, 'index'])->name('tags.index');
Route::post('tags', [TagController::class, 'store'])->name('tags.store');

// Placeholder routes to mirror legacy navigation
Route::get('/recipes', function () { return Inertia::render('recipes/index'); })->name('recipes.index');
Route::get('/menus', function () { return Inertia::render('menus/index'); })->name('menus.index');
Route::get('/suppliers', function () { return Inertia::render('suppliers/index'); })->name('suppliers.index');
Route::get('/stocktake', function () { return Inertia::render('stocktake/index'); })->name('stocktake.index');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
