// src/App.tsx - DEFINITIVE FINAL VERSION WITH ALL COLUMNS
import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import './App.css';

// --- API LOGIC AND INTERFACES ---
const API_BASE_URL = 'https://api.artic.edu/api/v1/artworks';

// Re-adding the missing fields to the interface
interface Artwork {
  id: number;
  title: string;
  artist_display: string;
  place_of_origin: string; // This was missing
  date_start: number; // This was missing
}

interface ApiResponse {
  pagination: { total: number };
  data: Artwork[];
}

const fetchArtworks = async (page: number, limit: number): Promise<ApiResponse> => {
    try {
        // Re-adding the fields to the API request
        const response = await axios.get<ApiResponse>(API_BASE_URL, {
            params: { page, limit, fields: 'id,title,artist_display,place_of_origin,date_start' },
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching artworks:", error);
        return { pagination: { total: 0 }, data: [] };
    }
};

const fetchBulkArtworks = async (count: number): Promise<Artwork[]> => {
    const artworks: Artwork[] = [];
    let page = 1;
    while (artworks.length < count) {
        const remaining = count - artworks.length;
        const limit = Math.min(100, remaining);
        try {
             // Re-adding the fields to the bulk API request
            const response = await fetchArtworks(page, limit);
            if (response.data.length === 0) break;
            artworks.push(...response.data);
            page++;
        } catch (error) {
            console.error("Error during bulk fetch:", error);
            break;
        }
    }
    return artworks.slice(0, count);
};

// --- MAIN APPLICATION COMPONENT ---
function App() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lazyState, setLazyState] = useState({ first: 0, rows: 10, page: 0 });
  const [selectedArtworks, setSelectedArtworks] = useState<Map<number, Artwork>>(new Map());
  const overlayPanelRef = useRef<OverlayPanel>(null);
  const [bulkSelectCount, setBulkSelectCount] = useState('');

  useEffect(() => {
    loadArtworks();
  }, [lazyState]);

  const loadArtworks = async () => {
    setLoading(true);
    const response = await fetchArtworks(lazyState.page + 1, lazyState.rows);
    setArtworks(response.data);
    setTotalRecords(response.pagination.total);
    setLoading(false);
  };

  const handleBulkSelectSubmit = async () => {
      const count = parseInt(bulkSelectCount, 10);
      if (isNaN(count) || count <= 0) return;
      setLoading(true);
      overlayPanelRef.current?.hide();
      setBulkSelectCount('');
      const bulkData = await fetchBulkArtworks(count);
      setSelectedArtworks(prev => {
          const newMap = new Map(prev);
          bulkData.forEach(art => newMap.set(art.id, art));
          return newMap;
      });
      setLoading(false);
  };

  const onSelectionChange = (e: { value: Artwork[] }) => {
      setSelectedArtworks(prev => {
          const newMap = new Map(prev);
          artworks.forEach(art => newMap.delete(art.id));
          e.value.forEach(art => newMap.set(art.id, art));
          return newMap;
      });
  };

  const selectionOnCurrentPage = useMemo(() => artworks.filter(art => selectedArtworks.has(art.id)), [artworks, selectedArtworks]);

 const header = (
    <div className="flex justify-content-between align-items-center">
        <div className="p-button p-button-sm p-component p-disabled">
            Selected: {selectedArtworks.size}
        </div>
    </div>
);


  return (
    <div className="App">
      <header className="App-header"><h1>React Internship Assignment</h1></header>
      <main className="content">
        <div className="card">
          <DataTable
            value={artworks} header={header} lazy paginator first={lazyState.first} rows={lazyState.rows}
            totalRecords={totalRecords} onPage={(e) => setLazyState(e)} loading={loading}
            dataKey="id" selection={selectionOnCurrentPage} onSelectionChange={onSelectionChange}
          > 
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
          <Column
            field="title"
            sortable
            header={
              <div className="flex items-center gap-2">
                <i
                  className="pi pi-chevron-down cursor-pointer text-gray-500 hover:text-gray-700"
                  onClick={(e) => overlayPanelRef.current?.toggle(e)}
                  style={{ fontSize: '0.9rem', marginLeft: '-20px' }}
                />
                <span>Title</span>
              </div>
            }
          />


            <Column field="artist_display" header="Artist" sortable />
            {/* Re-adding the missing columns */}
            <Column field="place_of_origin" header="Origin" sortable />
            <Column field="date_start" header="Date" sortable />
          </DataTable>
        </div>
        <OverlayPanel ref={overlayPanelRef}>
            <div className="p-inputgroup">
                <InputText type="number" placeholder="Select rows..." value={bulkSelectCount} onChange={(e) => setBulkSelectCount(e.target.value)} />
                <Button label="Submit" onClick={handleBulkSelectSubmit} />
            </div>
        </OverlayPanel>
      </main>
    </div>
  );
}

export default App;
