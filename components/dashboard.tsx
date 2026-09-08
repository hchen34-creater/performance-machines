"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

type Car = {
  id: number;
  car_make: string;
  car_model: string;
  year: number;
  engine_size_l: number | null;
  horsepower: number | null;
  torque_lb_ft: number | null;
  zero_to_sixty: number | null;
  price_usd: number | null;
};

export default function Dashboard({ cars }: { cars: Car[] }) {
  const [makeFilter, setMakeFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  const makes = useMemo(
    () => [
      "All",
      ...Array.from(new Set(cars.map((car) => car.car_make))).sort(),
    ],
    [cars]
  );

  const years = useMemo(
    () => [
      "All",
      ...Array.from(new Set(cars.map((car) => car.year)))
        .sort((a, b) => b - a)
        .map(String),
    ],
    [cars]
  );

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const matchesMake =
        makeFilter === "All" || car.car_make === makeFilter;

      const matchesYear =
        yearFilter === "All" || String(car.year) === yearFilter;

      return matchesMake && matchesYear;
    });
  }, [cars, makeFilter, yearFilter]);

  const stats = useMemo(() => {
    const horsepower = filteredCars
      .map((car) => car.horsepower)
      .filter((value): value is number => value !== null);

    const zeroToSixty = filteredCars
      .map((car) => car.zero_to_sixty)
      .filter((value): value is number => value !== null);

    const prices = filteredCars
      .map((car) => car.price_usd)
      .filter((value): value is number => value !== null);

    return {
      count: filteredCars.length,

      averageHorsepower:
        horsepower.length > 0
          ? Math.round(
              horsepower.reduce((sum, value) => sum + value, 0) /
                horsepower.length
            )
          : 0,

      fastest:
        zeroToSixty.length > 0 ? Math.min(...zeroToSixty) : 0,

      averagePrice:
        prices.length > 0
          ? Math.round(
              prices.reduce((sum, value) => sum + value, 0) /
                prices.length
            )
          : 0,
    };
  }, [filteredCars]);

  const fastestCars = useMemo(() => {
    return [...filteredCars]
      .filter((car) => car.zero_to_sixty !== null)
      .sort((a, b) => {
        return a.zero_to_sixty! - b.zero_to_sixty!;
      })
      .slice(0, 10);
  }, [filteredCars]);

  const featuredCar = fastestCars[0] ?? null;

  const scoreLimits = useMemo(() => {
    const horsepower = cars
      .map((car) => car.horsepower)
      .filter((value): value is number => value !== null);

    const zeroToSixty = cars
      .map((car) => car.zero_to_sixty)
      .filter((value): value is number => value !== null);

    const prices = cars
      .map((car) => car.price_usd)
      .filter((value): value is number => value !== null);

    return {
      maxHorsepower:
        horsepower.length > 0 ? Math.max(...horsepower) : 1,

      fastest:
        zeroToSixty.length > 0 ? Math.min(...zeroToSixty) : 1,

      cheapest:
        prices.length > 0 ? Math.min(...prices) : 1,
    };
  }, [cars]);

  const performanceScore = (car: Car) => {
    if (
      car.horsepower === null ||
      car.zero_to_sixty === null ||
      car.price_usd === null
    ) {
      return null;
    }

    const horsepowerScore =
      (car.horsepower / scoreLimits.maxHorsepower) * 50;

    const accelerationScore =
      (scoreLimits.fastest / car.zero_to_sixty) * 30;

    const valueScore =
      (scoreLimits.cheapest / car.price_usd) * 20;

    return Math.min(
      100,
      Math.round(
        horsepowerScore + accelerationScore + valueScore
      )
    );
  };

  const yearlyData = useMemo(() => {
    const grouped = new Map<
      number,
      { horsepower: number[]; zeroToSixty: number[] }
    >();

    filteredCars.forEach((car) => {
      if (!grouped.has(car.year)) {
        grouped.set(car.year, {
          horsepower: [],
          zeroToSixty: [],
        });
      }

      const group = grouped.get(car.year)!;

      if (car.horsepower !== null) {
        group.horsepower.push(car.horsepower);
      }

      if (car.zero_to_sixty !== null) {
        group.zeroToSixty.push(car.zero_to_sixty);
      }
    });

    return Array.from(grouped.entries())
      .map(([year, values]) => ({
        year,

        horsepower:
          values.horsepower.length > 0
            ? Math.round(
                values.horsepower.reduce((a, b) => a + b, 0) /
                  values.horsepower.length
              )
            : null,

        zeroToSixty:
          values.zeroToSixty.length > 0
            ? Number(
                (
                  values.zeroToSixty.reduce((a, b) => a + b, 0) /
                  values.zeroToSixty.length
                ).toFixed(2)
              )
            : null,
      }))
      .sort((a, b) => a.year - b.year);
  }, [filteredCars]);

  const makeData = useMemo(() => {
    const grouped = new Map<string, number[]>();

    filteredCars.forEach((car) => {
      if (car.horsepower === null) return;

      if (!grouped.has(car.car_make)) {
        grouped.set(car.car_make, []);
      }

      grouped.get(car.car_make)!.push(car.horsepower);
    });

    return Array.from(grouped.entries())
      .map(([make, horsepower]) => ({
        make,

        horsepower: Math.round(
          horsepower.reduce((a, b) => a + b, 0) /
            horsepower.length
        ),
      }))
      .sort((a, b) => b.horsepower - a.horsepower)
      .slice(0, 10);
  }, [filteredCars]);

  const scatterData = useMemo(() => {
    return filteredCars
      .filter(
        (car) =>
          car.horsepower !== null &&
          car.zero_to_sixty !== null
      )
      .map((car) => ({
        horsepower: car.horsepower,
        zeroToSixty: car.zero_to_sixty,
        name: `${car.car_make} ${car.car_model}`,
      }));
  }, [filteredCars]);

  const topCars = useMemo(() => {
    return [...filteredCars]
      .filter(
        (car) =>
          car.horsepower !== null &&
          car.zero_to_sixty !== null &&
          car.price_usd !== null
      )
      .sort((a, b) => {
        const scoreA = performanceScore(a) ?? 0;
        const scoreB = performanceScore(b) ?? 0;

        return scoreB - scoreA;
      })
      .slice(0, 10);
  }, [filteredCars, scoreLimits]);

  const money = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  const resetFilters = () => {
    setMakeFilter("All");
    setYearFilter("All");
  };

  const filtersActive =
    makeFilter !== "All" || yearFilter !== "All";

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="relative overflow-hidden border-b border-zinc-800 bg-zinc-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(239,68,68,0.12),transparent_35%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-14">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <Badge className="bg-red-600 px-3 py-1 text-xs font-semibold tracking-wide text-white hover:bg-red-600">
                  AUTOMOTIVE DATA
                </Badge>

                <span className="text-sm font-medium text-zinc-500">
                  1965 鈥?2023
                </span>
              </div>

              <h1 className="text-5xl font-bold tracking-tight text-white md:text-6xl">
                Performance Machines
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400 md:text-lg">
                A data-driven look at horsepower, acceleration,
                pricing, and performance across some of the world's
                most exciting cars.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-6 py-5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Dataset
              </p>

              <p className="mt-1 text-4xl font-bold tracking-tight text-white">
                {cars.length.toLocaleString()}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                vehicles analyzed
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <Card className="border-zinc-800 bg-zinc-900/70">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-lg text-white">
                  Explore the Data
                </CardTitle>

                <p className="mt-1 text-sm text-zinc-500">
                  Compare manufacturers and model years.
                </p>
              </div>

              {filtersActive && (
                <button
                  onClick={resetFilters}
                  className="w-fit rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-300 transition hover:border-red-500 hover:text-white"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-400">
                  Manufacturer
                </label>

                <select
                  value={makeFilter}
                  onChange={(event) =>
                    setMakeFilter(event.target.value)
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-red-500"
                >
                  {makes.map((make) => (
                    <option key={make} value={make}>
                      {make}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-400">
                  Model Year
                </label>

                <select
                  value={yearFilter}
                  onChange={(event) =>
                    setYearFilter(event.target.value)
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-red-500"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filtersActive && (
              <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Showing filtered results
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-zinc-800 bg-zinc-900/70 transition hover:-translate-y-0.5 hover:border-zinc-700">
            <CardContent className="pt-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Cars Shown
              </p>

              <p className="mt-3 text-3xl font-bold tracking-tight text-white">
                {stats.count.toLocaleString()}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Current selection
              </p>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/70 transition hover:-translate-y-0.5 hover:border-zinc-700">
            <CardContent className="pt-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Avg. Horsepower
              </p>

              <p className="mt-3 text-3xl font-bold tracking-tight text-white">
                {stats.averageHorsepower.toLocaleString()} hp
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Across selected vehicles
              </p>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/70 transition hover:-translate-y-0.5 hover:border-zinc-700">
            <CardContent className="pt-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Fastest 0鈥?0
              </p>

              <p className="mt-3 text-3xl font-bold tracking-tight text-red-400">
                {stats.fastest}s
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Quickest recorded time
              </p>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/70 transition hover:-translate-y-0.5 hover:border-zinc-700">
            <CardContent className="pt-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Avg. Price
              </p>

              <p className="mt-3 text-3xl font-bold tracking-tight text-white">
                {money(stats.averagePrice)}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Average listed price
              </p>
            </CardContent>
          </Card>
        </div>

        {featuredCar && (
          <Card
            onClick={() => setSelectedCar(featuredCar)}
            className="group mt-6 cursor-pointer overflow-hidden border-red-950 bg-zinc-900/70 transition hover:border-red-800"
          >
            <CardContent className="p-0">
              <div className="grid md:grid-cols-[1.35fr_1fr]">
                <div className="relative overflow-hidden p-7 md:p-9">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(239,68,68,0.16),transparent_45%)]" />

                  <div className="relative">
                    <div className="mb-5 flex items-center gap-3">
                      <Badge className="bg-red-600 text-white hover:bg-red-600">
                        FEATURED MACHINE
                      </Badge>

                      <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                        Fastest in current selection
                      </span>
                    </div>

                    <p className="text-sm font-medium text-zinc-500">
                      {featuredCar.year}
                    </p>

                    <h2 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">
                      {featuredCar.car_make} {featuredCar.car_model}
                    </h2>

                    <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">
                      The quickest vehicle in the current filtered dataset.
                      Select a different manufacturer or model year and this
                      feature updates automatically.
                    </p>

                    <p className="mt-5 text-sm font-medium text-red-400 transition group-hover:text-red-300">
                      View full performance profile →
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 border-t border-zinc-800 bg-zinc-950/50 md:border-l md:border-t-0">
                  <div className="border-b border-r border-zinc-800 p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                      0–60
                    </p>
                    <p className="mt-2 text-2xl font-bold text-red-400">
                      {featuredCar.zero_to_sixty}s
                    </p>
                  </div>

                  <div className="border-b border-zinc-800 p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                      Horsepower
                    </p>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {featuredCar.horsepower !== null
                        ? `${featuredCar.horsepower.toLocaleString()} hp`
                        : "N/A"}
                    </p>
                  </div>

                  <div className="border-r border-zinc-800 p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                      Torque
                    </p>
                    <p className="mt-2 text-xl font-bold text-white">
                      {featuredCar.torque_lb_ft !== null
                        ? `${featuredCar.torque_lb_ft.toLocaleString()} lb-ft`
                        : "N/A"}
                    </p>
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                      Price
                    </p>
                    <p className="mt-2 text-xl font-bold text-white">
                      {featuredCar.price_usd !== null
                        ? money(featuredCar.price_usd)
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <Card className="mt-6 border-red-950 bg-zinc-900/70">
          <CardHeader>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <CardTitle className="text-white">
                  Fastest Cars
                </CardTitle>

                <p className="mt-1 text-sm text-zinc-500">
                  Click a car to view its full performance profile.
                </p>
              </div>

              <Badge className="w-fit border border-red-900 bg-red-950 text-red-300 hover:bg-red-950">
                Top 10
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-800 text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Car</th>
                    <th className="px-4 py-3">Year</th>
                    <th className="px-4 py-3">Horsepower</th>
                    <th className="px-4 py-3">0鈥?0</th>
                    <th className="px-4 py-3">Price</th>
                  </tr>
                </thead>

                <tbody>
                  {fastestCars.map((car, index) => (
                    <tr
                      key={car.id}
                      onClick={() => setSelectedCar(car)}
                      className="cursor-pointer border-b border-zinc-800/70 transition hover:bg-zinc-800/50"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={
                            index === 0
                              ? "font-bold text-red-400"
                              : "text-zinc-500"
                          }
                        >
                          #{index + 1}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-medium text-white">
                        {car.car_make} {car.car_model}
                      </td>

                      <td className="px-4 py-3 text-zinc-400">
                        {car.year}
                      </td>

                      <td className="px-4 py-3 text-zinc-300">
                        {car.horsepower !== null
                          ? `${car.horsepower.toLocaleString()} hp`
                          : "N/A"}
                      </td>

                      <td className="px-4 py-3 font-semibold text-red-400">
                        {car.zero_to_sixty}s
                      </td>

                      <td className="px-4 py-3 text-zinc-400">
                        {car.price_usd !== null
                          ? money(car.price_usd)
                          : "N/A"}
                      </td>
                    </tr>
                  ))}

                  {fastestCars.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-zinc-500"
                      >
                        No cars match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="border-zinc-800 bg-zinc-900/70">
            <CardHeader>
              <CardTitle className="text-white">
                Horsepower Through the Years
              </CardTitle>

              <p className="text-sm text-zinc-500">
                Average horsepower by model year
              </p>
            </CardHeader>

            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearlyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#27272a"
                    />

                    <XAxis
                      dataKey="year"
                      stroke="#71717a"
                      tick={{ fontSize: 12 }}
                    />

                    <YAxis
                      stroke="#71717a"
                      tick={{ fontSize: 12 }}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #3f3f46",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="horsepower"
                      stroke="#ef4444"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/70">
            <CardHeader>
              <CardTitle className="text-white">
                Horsepower vs. 0鈥?0
              </CardTitle>

              <p className="text-sm text-zinc-500">
                Hover over a point to identify the car.
              </p>
            </CardHeader>

            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#27272a"
                    />

                    <XAxis
                      type="number"
                      dataKey="horsepower"
                      name="Horsepower"
                      stroke="#71717a"
                    />

                    <YAxis
                      type="number"
                      dataKey="zeroToSixty"
                      name="0鈥?0"
                      reversed
                      stroke="#71717a"
                    />

                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;

                        const point = payload[0]
                          .payload as {
                          name: string;
                          horsepower: number;
                          zeroToSixty: number;
                        };

                        return (
                          <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm shadow-xl">
                            <p className="font-semibold text-white">
                              {point.name}
                            </p>

                            <p className="text-zinc-400">
                              {point.horsepower} hp
                            </p>

                            <p className="text-zinc-400">
                              0鈥?0: {point.zeroToSixty}s
                            </p>
                          </div>
                        );
                      }}
                    />

                    <Scatter
                      data={scatterData}
                      fill="#ef4444"
                      fillOpacity={0.65}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/70 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">
                Average Horsepower by Manufacturer
              </CardTitle>

              <p className="text-sm text-zinc-500">
                Top 10 manufacturers in the current selection
              </p>
            </CardHeader>

            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={makeData}
                    layout="vertical"
                    margin={{
                      left: 20,
                      right: 20,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#27272a"
                    />

                    <XAxis
                      type="number"
                      stroke="#71717a"
                    />

                    <YAxis
                      type="category"
                      dataKey="make"
                      width={110}
                      stroke="#71717a"
                      tick={{ fontSize: 12 }}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #3f3f46",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />

                    <Bar
                      dataKey="horsepower"
                      fill="#ef4444"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 border-red-950 bg-zinc-900/70">
          <CardHeader>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <CardTitle className="text-white">
                  Performance Value
                </CardTitle>

                <p className="mt-1 text-sm text-zinc-500">
                  Which cars deliver the strongest combination of
                  power, acceleration, and price?
                </p>
              </div>

              <Badge className="w-fit border border-red-900 bg-red-950 text-red-300 hover:bg-red-950">
                0鈥?00 Score
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mb-5 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-sm leading-6 text-zinc-400">
                The score weighs horsepower at 50%, 0鈥?0 performance
                at 30%, and price at 20%. Higher scores represent
                cars that combine stronger performance with lower
                cost relative to the dataset.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-800 text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Car</th>
                    <th className="px-4 py-3">Year</th>
                    <th className="px-4 py-3">Horsepower</th>
                    <th className="px-4 py-3">0鈥?0</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Score</th>
                  </tr>
                </thead>

                <tbody>
                  {topCars.map((car, index) => {
                    const score = performanceScore(car);

                    return (
                      <tr
                        key={car.id}
                        onClick={() => setSelectedCar(car)}
                        className="cursor-pointer border-b border-zinc-800/70 transition hover:bg-zinc-800/50"
                      >
                        <td className="px-4 py-3 text-zinc-500">
                          {index + 1}
                        </td>

                        <td className="px-4 py-3 font-medium text-white">
                          {car.car_make} {car.car_model}
                        </td>

                        <td className="px-4 py-3 text-zinc-400">
                          {car.year}
                        </td>

                        <td className="px-4 py-3 text-zinc-300">
                          {car.horsepower?.toLocaleString()} hp
                        </td>

                        <td className="px-4 py-3 text-zinc-300">
                          {car.zero_to_sixty}s
                        </td>

                        <td className="px-4 py-3 text-zinc-400">
                          {car.price_usd !== null
                            ? money(car.price_usd)
                            : "N/A"}
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-bold text-red-400">
                            {score ?? "N/A"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {topCars.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-zinc-500"
                      >
                        No cars match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-8 bg-zinc-800" />

        <footer className="pb-10 text-sm text-zinc-600">
          Performance analysis built from the sports car pricing dataset.
        </footer>
      </div>

      <Dialog
        open={selectedCar !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCar(null);
          }
        }}
      >
        <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-lg">
          {selectedCar && (
            <>
              <DialogHeader>
                <Badge className="w-fit bg-red-600 text-white hover:bg-red-600">
                  {selectedCar.year}
                </Badge>

                <DialogTitle className="mt-2 text-2xl text-white">
                  {selectedCar.car_make} {selectedCar.car_model}
                </DialogTitle>

                <DialogDescription className="text-zinc-500">
                  Performance profile from the dataset.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-xs uppercase tracking-widest text-zinc-500">
                    Horsepower
                  </p>

                  <p className="mt-2 text-2xl font-bold text-white">
                    {selectedCar.horsepower !== null
                      ? `${selectedCar.horsepower.toLocaleString()} hp`
                      : "N/A"}
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-xs uppercase tracking-widest text-zinc-500">
                    0鈥?0
                  </p>

                  <p className="mt-2 text-2xl font-bold text-red-400">
                    {selectedCar.zero_to_sixty !== null
                      ? `${selectedCar.zero_to_sixty}s`
                      : "N/A"}
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-xs uppercase tracking-widest text-zinc-500">
                    Torque
                  </p>

                  <p className="mt-2 text-xl font-bold text-white">
                    {selectedCar.torque_lb_ft !== null
                      ? `${selectedCar.torque_lb_ft.toLocaleString()} lb-ft`
                      : "N/A"}
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-xs uppercase tracking-widest text-zinc-500">
                    Engine
                  </p>

                  <p className="mt-2 text-xl font-bold text-white">
                    {selectedCar.engine_size_l !== null
                      ? `${selectedCar.engine_size_l} L`
                      : "N/A"}
                  </p>
                </div>

                <div className="col-span-2 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-xs uppercase tracking-widest text-zinc-500">
                    Listed Price
                  </p>

                  <p className="mt-2 text-2xl font-bold text-white">
                    {selectedCar.price_usd !== null
                      ? money(selectedCar.price_usd)
                      : "N/A"}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}


