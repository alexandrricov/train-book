import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";

function formatDateTime(
  date: Date | number | string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }
): string {
  if (!date) return "";
  if (typeof date === "number" || typeof date === "string") {
    date = new Date(date);
  }

  return date.toLocaleString(
    navigator.language ?? navigator.languages,
    options
  );
}

// function formatDate(
//   date: Date | number | string,
//   options?: Intl.DateTimeFormatOptions
// ): string {
//   if (!date) return "";
//   if (typeof date === "number" || typeof date === "string") {
//     date = new Date(date);
//   }

//   return date.toLocaleDateString(
//     navigator.language ?? navigator.languages,
//     options
//   );
// }

// function formatTime(
//   date: Date | number | string,
//   options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }
// ): string {
//   if (!date) return "";
//   if (typeof date === "number" || typeof date === "string") {
//     date = new Date(date);
//   }

//   return date.toLocaleTimeString(
//     navigator.language ?? navigator.languages,
//     options
//   );
// }

const renderTooltip = (
  props: TooltipContentProps<ValueType, NameType>,
  titleFormat: NonNullable<
    React.ComponentProps<typeof Chart>["x"]
  >["itemFormat"],
  dataFormat: NonNullable<
    React.ComponentProps<typeof Chart>["y"]
  >["itemsFormat"]
) => {
  const { payload, label } = props;

  if (!payload) return null;

  const date = label && titleFormat ? titleFormat(label) : label;

  return (
    <div className="bg-grey-400 rounded-sm p-4">
      <dl className="text-nav1 mb-2">
        {payload.map((item, idx) => {
          return (
            <div className="flex items-center justify-between gap-2" key={idx}>
              <dt
                className=""
                style={{ "--dot-color": item.color } as React.CSSProperties}
              >
                {item.name}
              </dt>
              <dd className="">
                {dataFormat ? dataFormat(item.value) : item.value}
              </dd>
            </div>
          );
        })}
      </dl>
      <div className="text-nav1">{date}</div>
    </div>
  );
};

type KeyOf<T> = Extract<keyof T, string>;

export function Chart<
  Data extends Record<string, unknown>,
  XKey extends KeyOf<Data>,
  YKey extends KeyOf<Data>
>({
  data,
  x,
  y,
  className,
}: // loading = false,
{
  data: Data[];
  x: {
    key: XKey;
    format?: (item: Data[XKey]) => string;
    itemFormat?: (item: Data[XKey]) => string;
    ticks?: number[];
  };
  y: {
    key: YKey;
    title: string;
    format?: (item: Data[YKey]) => string;
    itemsFormat?: (item: Data[YKey]) => string;
  };
  className?: string;
  loading?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <LineChart width={500} height={300} data={data}>
        {/* <CartesianGrid stroke="#eee" strokeDasharray="5 5" /> */}
        <XAxis dataKey="date" />
        <YAxis />
        <Line type="monotone" dataKey="pushup" stroke="#8884d8" />
        <Line type="monotone" dataKey="pullup" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <AreaChart
        width={500}
        height={400}
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="colorPurple" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-purple-300)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-purple-300)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <XAxis
          dataKey={x.key}
          tickFormatter={x.format}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tickFormatter={y.format} axisLine={false} tickLine={false} />
        <Tooltip
          active
          labelFormatter={(value) => (
            <div className="bg-amber-800">
              {value ? formatDateTime(value) : ""}
            </div>
          )}
          content={(p) =>
            renderTooltip(
              p,
              // @ts-expect-error TODO
              x.itemFormat,
              y.itemsFormat
            )
          }
        />
        <Area
          type="monotone"
          dataKey={y.key}
          name={y.title}
          stroke="var(--color-purple-300)"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorPurple)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
