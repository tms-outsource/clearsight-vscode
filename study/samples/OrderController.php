<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\JsonResponse;

final class OrderController extends Controller
{
    private const PER_PAGE = 25;

    public function __construct(private readonly OrderService $orders) {}

    public function show(int $id): JsonResponse
    {
        // 404 when the order does not exist
        $order = Order::with('items')->findOrFail($id);

        return response()->json([
            'id' => $order->id,
            'status' => $order->status->label(),
            'total' => round($order->total, 2),
            'paid' => $order->paid_at !== null,
        ]);
    }
}
