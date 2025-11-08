import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import adminService from '../../services/adminService';

const CHART_COLORS = ['#2563EB', '#16A34A', '#DC2626', '#7C3AED', '#0D9488'];

const Reports = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lookbackDays, setLookbackDays] = useState(30);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await adminService.getHealthReports({ lookbackDays });
        setReport(response);
      } catch (err) {
        console.error('Error fetching health reports:', err);
        setError(err.response?.data?.message || 'Failed to load reports. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [lookbackDays, refreshToken]);

  const handlePrint = () => {
    window.print();
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setRefreshToken((prev) => prev + 1);
  };

  const summary = report?.summary;
  const diseases = report?.diseases ?? [];

  const diseaseMap = useMemo(() => {
    return new Map((report?.diseases || []).map((disease) => [disease.key, disease]));
  }, [report]);

  const timelineEntries = useMemo(() => {
    if (!report?.timelines) return [];

    return Object.entries(report.timelines).map(([key, timeline], index) => {
      const summaryItem = diseaseMap.get(key);
      const counts = timeline.points.map((point) => point.count);
      const lastNonZero = [...counts].reverse().find((value) => value > 0) ?? counts[counts.length - 1] ?? 0;

      return {
        key,
        label: timeline.label,
        diseaseCode: timeline.diseaseCode || summaryItem?.diseaseCode || null,
        points: timeline.points,
        color: CHART_COLORS[index % CHART_COLORS.length],
        gradientId: `trend-gradient-${key}`,
        latestValue: summaryItem?.recentCases ?? lastNonZero,
        change: summaryItem?.trendPercentage ?? 0
      };
    });
  }, [report, diseaseMap]);

  const pieData = useMemo(() => {
    if (!diseases.length) return [];

    const totalRecent = diseases.reduce((acc, disease) => acc + disease.recentCases, 0);

    return diseases.slice(0, CHART_COLORS.length).map((disease, index) => {
      const male = disease.recentMaleCases ?? disease.maleCases ?? 0;
      const female = disease.recentFemaleCases ?? disease.femaleCases ?? 0;
      const unknown = disease.recentUnknownGenderCases ?? disease.unknownGenderCases ?? 0;
      const genderTotal = male + female + unknown;
      const fallbackTotal = genderTotal || (disease.recentCases ?? 0);

      const toPercentage = (value) => (fallbackTotal ? (value / fallbackTotal) * 100 : 0);

      return {
        ...disease,
        color: CHART_COLORS[index % CHART_COLORS.length],
        recentCasesPercentage: totalRecent ? (disease.recentCases / totalRecent) * 100 : 0,
        genderBreakdown: {
          male: { count: male, percentage: toPercentage(male) },
          female: { count: female, percentage: toPercentage(female) },
          unknown: { count: unknown, percentage: toPercentage(unknown) }
        }
      };
    });
  }, [diseases]);

  const combinedTrendData = useMemo(() => {
    if (!timelineEntries.length) return [];

    const dateMap = new Map();

    timelineEntries.forEach(({ key, points }) => {
      points.forEach(({ isoDate, date, count }) => {
        const mapKey = isoDate || date;
        const existing = dateMap.get(mapKey) || { date, isoDate: mapKey };
        existing[key] = count;
        // Keep the most descriptive date label
        existing.date = date;
        dateMap.set(mapKey, existing);
      });
    });

    return Array.from(dateMap.values()).sort((a, b) => {
      const aDate = new Date(a.isoDate || a.date);
      const bDate = new Date(b.isoDate || b.date);
      return aDate.getTime() - bDate.getTime();
    });
  }, [timelineEntries]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow border p-8 text-center">
        <p className="text-lg font-semibold text-gray-700">Loading health surveillance data…</p>
        <p className="text-sm text-gray-500 mt-2">Please wait while we consolidate real-time records.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow border p-8 text-center space-y-4">
        <p className="text-lg font-semibold text-red-600">Unable to load reports</p>
        <p className="text-sm text-gray-600">{error}</p>
        <button
          onClick={handleRetry}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 print:justify-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Health Surveillance Reports</h1>
          {summary && (
            <p className="text-gray-600 mt-1">
              Aggregated case counts sourced from doctor-uploaded case documents ({summary.activeConditions} active conditions out of {summary.uniqueConditions} documented diagnoses).
            </p>
          )}
          {report?.generatedAt && (
            <p className="text-sm text-gray-500 mt-1">
              Generated at: {new Date(report.generatedAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            Lookback window
            <select
              value={lookbackDays}
              onChange={(e) => setLookbackDays(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </label>
          <button
            onClick={handlePrint}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors"
          >
            Print Report
          </button>
        </div>
      </div>

      {summary && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow border p-4">
            <p className="text-sm text-gray-500">Total Reported Cases</p>
            <p className="text-3xl font-bold text-primary-600 mt-2">{summary.totalCases.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl shadow border p-4">
            <p className="text-sm text-gray-500">
              New Cases (last {summary.lookbackDays} days)
            </p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{summary.recentCases.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl shadow border p-4">
            <p className="text-sm text-gray-500">New Cases (last 7 days)</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{summary.lastSevenDays.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl shadow border p-4">
            <p className="text-sm text-gray-500">Active / Total Diagnoses</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {summary.activeConditions}/{summary.uniqueConditions}
            </p>
          </div>
        </section>
      )}

      <section className="bg-white rounded-2xl shadow border">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Disease Breakdown</h2>
          <p className="text-sm text-gray-500">
            Counts derived from doctor-uploaded documents. Last {summary?.lookbackDays ?? lookbackDays} days window highlighted (showing top {summary?.trackedConditions ?? diseases.length} diagnoses).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Disease</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Cases</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Cases (last {summary?.lookbackDays ?? lookbackDays} days)
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cases (last 7 days)</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Prev 7 days</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trend</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Most Recent Case</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {diseases.map((disease) => {
                const trendColor =
                  disease.trendPercentage > 0
                    ? 'text-red-600'
                    : disease.trendPercentage < 0
                      ? 'text-green-600'
                      : 'text-gray-600';
                const trendLabel =
                  disease.trendPercentage === 0
                    ? 'No change'
                    : `${disease.trendPercentage > 0 ? '+' : ''}${disease.trendPercentage}%`;

                return (
                  <tr key={disease.key} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-800">{disease.label}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{disease.diseaseCode || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{disease.totalCases.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-yellow-700 font-medium">
                      {disease.recentCases.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-medium">
                      {disease.lastSevenDays.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {disease.prevSevenDays.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-xs font-semibold ${trendColor}`}>
                        {trendLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {disease.lastUpdated ? new Date(disease.lastUpdated).toLocaleString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Trends</h3>
          {timelineEntries.length === 0 ? (
            <p className="text-sm text-gray-500">No recorded cases in the selected window.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-3 mb-6">
                {timelineEntries.map((trend) => (
                  <div
                    key={trend.key}
                    className="rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 min-w-[160px]"
                    style={{ borderTop: `3px solid ${trend.color}` }}
                  >
                    <p className="text-sm font-semibold text-gray-700">
                      {trend.label}
                      {trend.diseaseCode ? ` (${trend.diseaseCode})` : ''}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mt-1">Cases (last 7 days)</p>
                    <p className="text-2xl font-bold text-primary-600">{trend.latestValue.toLocaleString()}</p>
                    <p
                      className={`text-xs font-semibold ${
                        trend.change > 0 ? 'text-red-600' : trend.change < 0 ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      {trend.change > 0 ? '+' : ''}
                      {trend.change}% vs previous week
                    </p>
                  </div>
                ))}
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedTrendData} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="4 6" stroke="#E2E8F0" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={{ stroke: '#CBD5F5' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                      minTickGap={15}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={{ stroke: '#CBD5F5' }}
                      tickLine={false}
                      allowDecimals={false}
                      minTickGap={10}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        const trend = timelineEntries.find((entry) => entry.key === name);
                        const label = trend ? trend.label : name;
                        return [`${value} case${value === 1 ? '' : 's'}`, label];
                      }}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend
                      formatter={(value) => {
                        const trend = timelineEntries.find((entry) => entry.key === value);
                        return trend ? trend.label : value;
                      }}
                    />
                    {timelineEntries.map((trend) => (
                      <Line
                        key={trend.key}
                        type="monotone"
                        dataKey={trend.key}
                        stroke={trend.color}
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Case Share by Disease</h3>
          {pieData.length === 0 ? (
            <p className="text-sm text-gray-500">No diagnosed conditions recorded in the selected window.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <defs>
                  {pieData.map((disease, index) => (
                    <linearGradient
                      key={disease.key}
                      id={`pie-gradient-${disease.key}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.85} />
                      <stop offset="100%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.55} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={pieData}
                  dataKey="recentCases"
                  nameKey="label"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  cornerRadius={8}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {pieData.map((disease, index) => (
                    <Cell
                      key={disease.key}
                      fill={`url(#pie-gradient-${disease.key})`}
                      stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  formatter={(value, entry, idx) => {
                    const disease = pieData.find((item) => item.label === value);
                    if (!disease) return value;
                    const base = `${value} — ${disease.recentCases.toLocaleString()} cases (${disease.recentCasesPercentage.toFixed(1)}%)`;
                    const femaleCount = disease.genderBreakdown?.female?.count ?? 0;
                    const maleCount = disease.genderBreakdown?.male?.count ?? 0;
                    const unknownCount = disease.genderBreakdown?.unknown?.count ?? 0;
                    const genderParts = [];
                    if (femaleCount > 0) genderParts.push(`F:${femaleCount.toLocaleString()}`);
                    if (maleCount > 0) genderParts.push(`M:${maleCount.toLocaleString()}`);
                    if (genderParts.length === 0 && unknownCount > 0) {
                      genderParts.push(`U:${unknownCount.toLocaleString()}`);
                    }
                    return genderParts.length ? `${base} • ${genderParts.join(' | ')}` : base;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Preparedness Checklist</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-primary-500" />
              Validate vaccine and antiviral stock levels for respiratory illnesses.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-primary-500" />
              Review isolation and treatment bed availability relative to current active cases.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-primary-500" />
              Coordinate with surveillance teams for contact tracing on newly detected clusters.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-primary-500" />
              Issue weekly advisories reinforcing symptom monitoring and early consultation.
            </li>
          </ul>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow border p-6 print:break-before-page">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Notes & Next Steps</h3>
        <p className="text-sm text-gray-600">
          Figures reflect diagnoses recorded within the health center&apos;s medical records as of the generation timestamp.
          Ensure reconciliation with provincial and national surveillance data prior to distribution.
        </p>
        <p className="text-sm text-gray-600 mt-4">
          <span className="font-semibold text-gray-700">Reminder:</span> If new conditions need monitoring, update the tracked disease
          registry in the admin configuration or extend the reporting endpoint.
        </p>
      </section>
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const [{ name, value, payload: raw }] = payload;
  const breakdown = raw?.genderBreakdown;
  const breakdownEntries = breakdown
    ? [
        { key: 'female', label: 'Female', color: 'bg-pink-500', data: breakdown.female },
        { key: 'male', label: 'Male', color: 'bg-blue-500', data: breakdown.male },
        { key: 'unknown', label: 'Unknown', color: 'bg-gray-400', data: breakdown.unknown }
      ].filter((item) => item.data && typeof item.data.count === 'number')
    : [];
  const hasGenderData = breakdownEntries.some((item) => (item.data?.count ?? 0) > 0);

  return (
    <div className="bg-white shadow-lg px-4 py-3 rounded-xl border border-gray-200">
      <p className="text-sm font-semibold text-gray-700">{name}</p>
      {raw?.diseaseCode && (
        <p className="text-xs text-gray-500 mb-1">Code: {raw.diseaseCode}</p>
      )}
      <p className="text-sm text-gray-600">
        {value.toLocaleString()} case{value === 1 ? '' : 's'}
      </p>
      <p className="text-xs text-gray-500">
        Share: {raw?.recentCasesPercentage?.toFixed(1) ?? 0}%
      </p>
      {breakdownEntries.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-500 mb-1">Recent cases by gender</p>
          {hasGenderData ? (
            <div className="space-y-1 text-xs text-gray-600">
              {breakdownEntries.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${item.color}`} />
                    {item.label}
                  </span>
                  <span className="font-medium text-gray-700">
                    {item.data.count.toLocaleString()} ({(item.data.percentage ?? 0).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No gender data recorded.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
