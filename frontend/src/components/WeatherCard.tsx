import React from 'react';
import { Cloud, Droplets, Wind, Sunrise, Sunset } from 'lucide-react';

interface WeatherProps {
  data: {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    description: string;
    icon: string;
    sunrise: number;
    sunset: number;
    location: string;
  };
}

export const WeatherCard: React.FC<WeatherProps> = ({ data }) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="mt-3 mb-1 max-w-sm w-full rounded-md border border-border bg-surface overflow-hidden">
      <div className="p-3.5 flex justify-between items-start border-b border-border">
        <div>
          <h3 className="text-[14px] font-semibold text-text">{data.location}</h3>
          <p className="text-[12px] text-text-secondary capitalize mt-0.5">{data.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <img
            src={`https://openweathermap.org/img/wn/${data.icon}.png`}
            alt={data.description}
            className="w-8 h-8 opacity-90"
          />
          <span className="font-mono text-[20px] font-medium text-text">{Math.round(data.temp)}°</span>
        </div>
      </div>

      <div className="p-3.5 grid grid-cols-2 gap-y-3 gap-x-4 bg-bg">
        {[
          { icon: Wind,    label: 'Wind',    value: `${data.wind_speed} m/s` },
          { icon: Droplets, label: 'Humidity', value: `${data.humidity}%` },
          { icon: Sunrise, label: 'Sunrise',  value: formatTime(data.sunrise) },
          { icon: Sunset,  label: 'Sunset',   value: formatTime(data.sunset) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Icon size={12} />
              <span className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
            </div>
            <span className="font-mono text-[13px] text-text ml-4.5">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
