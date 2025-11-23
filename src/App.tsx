import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './App.css';

interface Route {
  train_length: number;
  arrival_departure: 'A' | 'D';
  dest_en: string;
  dest_ch: string;
  time_en: string;
  time_ch: string;
  route_no: string;
  stop: number;
}

interface Platform {
  platform_id: number;
  route_list?: Route[];  // Made optional to match potential API response
}

interface ApiResponse {
  status: number;
  system_time: string;
  platform_list?: Platform[];  // Made optional for safety
}

const STATIONS: Record<string, string> = {
  "1": "Tuen Mun Ferry Pier (屯門碼頭)",
  "10": "Melody Garden (美樂)",
  "15": "Butterfly (蝴蝶)",
  "20": "Light Rail Depot (輕鐵車廠)",
  "30": "Lung Mun (龍門)",
  "40": "Tsing Shan Tsuen (青山村)",
  "50": "Tsing Wun (青雲)",
  "60": "Kin On (建安)",
  "70": "Ho Tin (河田)",
  "75": "Choy Yee Bridge (蔡意橋)",
  "80": "Affluence (澤豐)",
  "90": "Tuen Mun Hospital (屯門醫院)",
  "100": "Siu Hong (兆康)",
  "110": "Kei Lun (麒麟)",
  "120": "Ching Chung (青松)",
  "130": "Kin Sang (建生)",
  "140": "Tin King (田景)",
  "150": "Leung King (良景)",
  "160": "San Wai (新圍)",
  "170": "Shek Pai (石排)",
  "180": "Shan King (North) (山景（北）)",
  "190": "Shan King (South) (山景（南）)",
  "200": "Ming Kum (鳴琴)",
  "212": "Tai Hing (North) (大興（北）)",
  "220": "Tai Hing (South) (大興（南）)",
  "230": "Ngan Wai (銀圍)",
  "240": "Siu Hei (兆禧)",
  "250": "Tuen Mun Swimming Pool (屯門泳池)",
  "260": "Goodview Garden (豐景園)",
  "265": "Siu Lun (兆麟)",
  "270": "On Ting (安定)",
  "275": "Yau Oi (友愛)",
  "280": "Town Centre (市中心)",
  "295": "Tuen Mun (屯門)",
  "300": "Pui To (杯渡)",
  "310": "Hoh Fuk Tong (何福堂)",
  "320": "San Hui (新墟)",
  "330": "Prime View (景峰)",
  "340": "Fung Tei (鳳地)",
  "350": "Lam Tei (藍地)",
  "360": "Nai Wai (泥圍)",
  "370": "Chung Uk Tsuen (鍾屋村)",
  "380": "Hung Shui Kiu (洪水橋)",
  "390": "Tong Fong Tsuen (塘坊村)",
  "400": "Ping Shan (屏山)",
  "425": "Hang Mei Tsuen (坑尾村)",
  "430": "Tin Shui Wai (天水圍)",
  "435": "Tin Tsz (天慈)",
  "445": "Tin Yiu (天耀)",
  "448": "Locwood (樂湖)",
  "450": "Tin Wu (天湖)",
  "455": "Ginza (銀座)",
  "460": "Tin Shui (天瑞)",
  "468": "Chung Fu (頌富)",
  "480": "Tin Fu (天富)",
  "490": "Chestwood (翠湖)",
  "500": "Tin Wing (天榮)",
  "510": "Tin Yuet (天悅)",
  "520": "Tin Sau (天秀)",
  "530": "Wetland Park (濕地公園)",
  "540": "Tin Heng (天恒)",
  "550": "Tin Yat (天逸)",
  "560": "Shui Pin Wai (水邊圍)",
  "570": "Fung Nin Road (豐年路)",
  "580": "Hong Lok Road (康樂路)",
  "590": "Tai Tong Road (大棠路)",
  "600": "Yuen Long (元朗)",
  "920": "Sam Shing (三聖)"
};

function App() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>('600'); // Yuen Long default
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredStations = useMemo(() => {
    if (!search) return Object.entries(STATIONS);
    const lower = search.toLowerCase();
    return Object.entries(STATIONS).filter(([id, name]) =>
      name.toLowerCase().includes(lower) ||
      name.includes(search) ||
      id === search
    );
  }, [search]);

  const fetchData = async (id: string) => {
    setLoading(true);
    try {
      const res = await axios.get<ApiResponse>(
        `https://rt.data.gov.hk/v1/transport/mtr/lrt/getSchedule?station_id=${id}`
      );
      setData(res.data);
    } catch (err) {
      console.error(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedId);
    const interval = setInterval(() => fetchData(selectedId), 20000);
    return () => clearInterval(interval);
  }, [selectedId]);

  return (
    <div className="app">
      <header className="header">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search station... (e.g. 元朗, Yuen Long, 600)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-box"
          />
          {search && (
            <div className="dropdown">
              {filteredStations.length === 0 ? (
                <div className="dropdown-item">No station found</div>
              ) : (
                filteredStations.map(([id, name]) => (
                  <div
                    key={id}
                    className="dropdown-item"
                    onClick={() => {
                      setSelectedId(id);
                      setSearch('');
                    }}
                  >
                    {name}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <div className="logo">Light Rail Next Train</div>
      </header>

      <main className="main">
        {loading && <div className="spinner">Loading...</div>}

        {data && data.status === 1 ? (
          <>
            <h1 className="station-title">{STATIONS[selectedId]}</h1>

            {data.platform_list?.length ? (
              data.platform_list.map((platform) => (
                <div key={platform.platform_id} className="platform-card">
                  <div className="platform-header">
                    Platform {platform.platform_id}
                  </div>
                  <div className="routes">
                    {platform.route_list?.length ? (
                      platform.route_list.map((route, i) => (
                        <div
                          key={i}
                          className={`route-item ${route.train_length === 2 ? 'coupled' : ''} ${
                            route.time_en === '-' ? 'arriving' : ''
                          } ${route.stop === 1 ? 'stopped' : ''}`}
                        >
                          <div className="route-no">{route.route_no}</div>
                          <div className="dest">
                            <div className="en">{route.dest_en}</div>
                            <div className="ch">{route.dest_ch}</div>
                          </div>
                          <div className="time">
                            <div className="en">{route.time_en}</div>
                            <div className="ch">{route.time_ch}</div>
                          </div>
                          <div className="length">
                            {route.train_length === 1 ? 'Single' : 'Coupled'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div>No routes available for this platform</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p>No platform information available.</p>
            )}

            <div className="update">
              Updated: {data.system_time ? new Date(data.system_time).toLocaleTimeString('en-HK') : ''}
            </div>
          </>
        ) : (
          <p>No data available or service error. Please try again.</p>
        )}
      </main>
    </div>
  );
}

export default App;