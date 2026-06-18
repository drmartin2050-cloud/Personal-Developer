import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Type, Square, Circle, Image as ImageIcon, Download, 
  Trash2, MousePointer2, Move, Undo2, Redo2, Palette, Search, Sparkles, X, Plus, Minus
} from 'lucide-react';
import { Stage, Layer, Rect, Circle as KonvaCircle, Text, Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  lang: 'ar' | 'en';
}

type ElementType = 'text' | 'rect' | 'circle' | 'image';

interface ElementProps {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  fill?: string;
  text?: string;
  fontSize?: number;
  src?: string;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

const URLImage = ({ element, isSelected, onSelect, onChange }: any) => {
  const [image] = useImage(element.src, 'anonymous');
  const shapeRef = useRef<any>();
  const trRef = useRef<any>();

  useEffect(() => {
    if (isSelected && trRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <KonvaImage
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        {...element}
        image={image}
        draggable
        onDragEnd={(e) => {
          onChange({
            ...element,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...element,
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
          });
        }}
      />
      {isSelected && (
        <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => newBox} />
      )}
    </React.Fragment>
  );
};

const ShapeRenderer = ({ element, isSelected, onSelect, onChange }: any) => {
  const shapeRef = useRef<any>();
  const trRef = useRef<any>();

  useEffect(() => {
    if (isSelected && trRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const commonProps = {
    onClick: onSelect,
    onTap: onSelect,
    ref: shapeRef,
    ...element,
    draggable: true,
    onDragEnd: (e: any) => {
      onChange({
        ...element,
        x: e.target.x(),
        y: e.target.y(),
      });
    },
    onTransformEnd: (e: any) => {
      const node = shapeRef.current;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);

      if (element.type === 'circle') {
         onChange({
          ...element,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          radius: Math.max(5, (node.radius() * scaleX)),
        });
      } else if (element.type === 'text') {
        onChange({
          ...element,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: Math.max(5, node.width() * scaleX),
          fontSize: Math.max(5, element.fontSize * scaleX),
        });
      } else {
        onChange({
          ...element,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
        });
      }
    }
  };

  return (
    <React.Fragment>
      {element.type === 'rect' && <Rect {...commonProps} />}
      {element.type === 'circle' && <KonvaCircle {...commonProps} />}
      {element.type === 'text' && <Text {...commonProps} />}
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
          enabledAnchors={element.type === 'text' ? ['middle-left', 'middle-right'] : undefined}
        />
      )}
    </React.Fragment>
  );
};


export default function DesignEditor({ lang }: Props) {
  const isAr = lang === 'ar';
  
  const [elements, setElements] = useState<ElementProps[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [history, setHistory] = useState<{elements: ElementProps[], bgColor: string}[]>([]);
  const [historyStep, setHistoryStep] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [editingTextNode, setEditingTextNode] = useState<{ id: string, text: string } | null>(null);
  
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard Delete & Deselect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid deleting if they are typing in an input box
      if (document.activeElement?.tagName.toLowerCase() === 'input') return;
      if (document.activeElement?.tagName.toLowerCase() === 'textarea') return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        saveHistory();
        setElements(elements.filter(el => el.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elements, selectedId]);

  const saveHistory = () => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push({ elements: JSON.parse(JSON.stringify(elements)), bgColor });
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyStep === 0) return;
    const previousStep = historyStep - 1;
    setElements(history[previousStep].elements);
    setBgColor(history[previousStep].bgColor);
    setHistoryStep(previousStep);
    setSelectedId(null);
  };

  const handleRedo = () => {
    if (historyStep === history.length - 1) return;
    const nextStep = historyStep + 1;
    setElements(history[nextStep].elements);
    setBgColor(history[nextStep].bgColor);
    setHistoryStep(nextStep);
    setSelectedId(null);
  };

  const checkDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

  const addText = () => {
    saveHistory();
    const id = uuidv4();
    setElements([...elements, { id, type: 'text', x: 50, y: 50, text: isAr ? 'نص جديد' : 'New Text', fontSize: 40, fill: '#000000', width: 200 }]);
    setSelectedId(id);
  };

  const addRect = () => {
    saveHistory();
    const id = uuidv4();
    setElements([...elements, { id, type: 'rect', x: 100, y: 100, width: 100, height: 100, fill: '#3b82f6' }]);
    setSelectedId(id);
  };

  const addCircle = () => {
    saveHistory();
    const id = uuidv4();
    setElements([...elements, { id, type: 'circle', x: 150, y: 150, radius: 50, fill: '#ef4444' }]);
    setSelectedId(id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          saveHistory();
          const id = uuidv4();
          
          // Image object to get dimensions
          const img = new window.Image();
          img.src = reader.result;
          img.onload = () => {
            const aspect = img.width / img.height;
            const w = Math.min(img.width, 300);
            const h = w / aspect;

            setElements((prev) => [
              ...prev,
              { id, type: 'image', x: 50, y: 50, src: reader.result as string, width: w, height: h }
            ]);
            setSelectedId(id);
          };
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleExport = () => {
    if (!stageRef.current) return;
    // hide selection briefly to take clean shot
    const oldSelection = selectedId;
    setSelectedId(null);
    
    setTimeout(() => {
        const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = `canva-studio-export.png`;
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setSelectedId(oldSelection); // restore
    }, 100);
  };

  // Editing Text On double tap
  const handleDblClick = (e: any) => {
    if (selectedId) {
      const el = elements.find((item) => item.id === selectedId);
      if (el && el.type === 'text') {
         setEditingTextNode({ id: el.id, text: el.text || '' });
      }
    }
  };

  const updateText = (newText: string) => {
    if (!editingTextNode) return;
    saveHistory();
    setElements(elements.map((el) => {
      if (el.id === editingTextNode.id) {
        return { ...el, text: newText };
      }
      return el;
    }));
  };

  const changeSelectedColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedId) return;
    setElements(elements.map(el => {
      if (el.id === selectedId) {
        return { ...el, fill: e.target.value };
      }
      return el;
    }));
  };

  // Initial History Save
  useEffect(() => {
    if (history.length === 0) saveHistory();
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#E8EAED] dark:bg-slate-900 font-sans" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
      
      {/* ----- Top Nav Bar ----- */}
      <div className="h-14 bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            Pro
          </div>
          <div className="flex items-center gap-2" dir="ltr">
             <button onClick={handleUndo} disabled={historyStep === 0} className={`p-1.5 rounded transition-colors ${historyStep === 0 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'}`}>
                <Undo2 size={18} />
             </button>
             <button onClick={handleRedo} disabled={historyStep === history.length - 1} className={`p-1.5 rounded transition-colors ${historyStep === history.length - 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'}`}>
                <Redo2 size={18} />
             </button>
          </div>
          <div className="h-6 w-px bg-gray-200 dark:bg-slate-800 mx-2" />
          <span className="font-semibold text-gray-700 dark:text-slate-200 text-sm hidden sm:block">
            {isAr ? 'مشروع تصميم جديد - استوديو كامل' : 'Untitled Design - Full Studio'}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="px-5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2 text-sm font-semibold transition-colors">
            <Download size={16} />
            <span>{isAr ? 'تنزيل كصورة' : 'Download Image'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* ----- Main Sidebar ----- */}
        <div className="w-20 bg-gray-50 dark:bg-slate-950 flex flex-col items-center py-4 border-l border-r dark:border-slate-800 border-gray-200 z-10 shrink-0">
           
           <button onClick={addText} className="flex flex-col items-center gap-1.5 w-16 p-3 rounded-xl mb-2 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-900 transition-colors">
             <Type size={24} />
             <span className="text-[10px] font-medium">{isAr ? 'نص' : 'Text'}</span>
           </button>

           <button onClick={addRect} className="flex flex-col items-center gap-1.5 w-16 p-3 rounded-xl mb-2 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-900 transition-colors">
             <Square size={24} />
             <span className="text-[10px] font-medium">{isAr ? 'مربع' : 'Rect'}</span>
           </button>

           <button onClick={addCircle} className="flex flex-col items-center gap-1.5 w-16 p-3 rounded-xl mb-2 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-900 transition-colors">
             <Circle size={24} />
             <span className="text-[10px] font-medium">{isAr ? 'دائرة' : 'Circle'}</span>
           </button>

           <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1.5 w-16 p-3 rounded-xl mb-2 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-900 transition-colors">
             <ImageIcon size={24} />
             <span className="text-[10px] font-medium">{isAr ? 'صورة' : 'Image'}</span>
           </button>
           <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />

           <div className="flex-1" />
        </div>

        {/* ----- Secondary Context/Tool Bar ----- */}
        {(selectedId || true) && (
        <div className="w-64 bg-white dark:bg-slate-900 border-l border-r dark:border-slate-800 border-gray-200 shadow z-10 overflow-y-auto flex flex-col p-4">
           {selectedId ? (
              <React.Fragment>
                <div className="flex items-center gap-2 mb-6">
                 <h3 className="font-bold text-sm text-gray-800 dark:text-slate-200 uppercase tracking-widest">{isAr ? 'خصائص العنصر' : 'Properties'}</h3>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500">{isAr ? 'اللون' : 'Color'}</label>
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 p-2 rounded-lg">
                      <input 
                        type="color" 
                        value={elements.find(e => e.id === selectedId)?.fill || '#000000'}
                        onChange={changeSelectedColor}
                        className="w-8 h-8 rounded shrink-0 cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
                        {elements.find(e => e.id === selectedId)?.fill || '#000000'}
                      </span>
                    </div>
                  </div>
                  
                  {elements.find(e => e.id === selectedId)?.type === 'text' && (
                     <div className="flex flex-col gap-1.5">
                       <label className="text-xs font-semibold text-gray-500">{isAr ? 'النص: المزدوج للتعديل بالداخل' : 'Text: double click to edit'}</label>
                     </div>
                  )}

                  <hr className="border-gray-200 dark:border-slate-800 my-2" />

                  <button onClick={() => {
                        saveHistory();
                        setElements(elements.filter(el => el.id !== selectedId));
                        setSelectedId(null);
                      }} 
                      className="flex justify-center items-center gap-2 py-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium text-sm">
                    <Trash2 size={16} />
                    {isAr ? 'حذف العنصر' : 'Delete Element'}
                  </button>
                </div>
              </React.Fragment>
           ) : (
              <React.Fragment>
                 <div className="flex items-center gap-2 mb-6">
                 <h3 className="font-bold text-sm text-gray-800 dark:text-slate-200 uppercase tracking-widest">{isAr ? 'خصائص الصفحة' : 'Page Props'}</h3>
                </div>

                <div className="flex flex-col gap-4">
                   <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500">{isAr ? 'لون الخلفية' : 'Background Color'}</label>
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 p-2 rounded-lg">
                      <input 
                        type="color" 
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-8 h-8 rounded shrink-0 cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
                        {bgColor}
                      </span>
                    </div>
                  </div>
                </div>
              </React.Fragment>
           )}
        </div>
        )}

        {/* ----- Canvas Area ----- */}
        <div className="flex-1 relative overflow-auto bg-gray-200 dark:bg-slate-900 flex items-center justify-center p-8" ref={containerRef}>
            
            {/* The actual canvas frame wrapper */}
            <div 
               className="bg-white shadow-[0_4px_30px_rgba(0,0,0,0.1)] relative" 
               style={{ width: 800, height: 600, transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            >
               <Stage 
                  width={800} 
                  height={600} 
                  onMouseDown={checkDeselect}
                  onTouchStart={checkDeselect}
                  onDblClick={handleDblClick}
                  onDblTap={handleDblClick}
                  ref={stageRef}
                >
                 <Layer>
                    <Rect width={800} height={600} fill={bgColor} />
                 </Layer>
                 <Layer>
                   {elements.map((el, i) => {
                     return el.type === 'image' ? (
                       <URLImage 
                         key={el.id} 
                         element={el}
                         isSelected={el.id === selectedId}
                         onSelect={() => setSelectedId(el.id)}
                         onChange={(newAttrs: any) => {
                           const newElements = elements.map(item => item.id === el.id ? newAttrs : item);
                           setElements(newElements);
                         }}
                       />
                     ) : (
                       <ShapeRenderer 
                         key={el.id} 
                         element={el}
                         isSelected={el.id === selectedId}
                         onSelect={() => setSelectedId(el.id)}
                         onChange={(newAttrs: any) => {
                           const newElements = elements.map(item => item.id === el.id ? newAttrs : item);
                           setElements(newElements);
                         }}
                       />
                     );
                   })}
                 </Layer>
               </Stage>

               {/* In-place Text Editor Overlay */}
               {editingTextNode && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-xl shadow-2xl w-96 max-w-full">
                       <h4 className="font-bold mb-2">{isAr ? 'تعديل النص' : 'Edit Text'}</h4>
                       <textarea 
                         className="w-full border p-2 rounded" 
                         rows={4}
                         value={editingTextNode.text}
                         onChange={(e) => setEditingTextNode({...editingTextNode, text: e.target.value})}
                         autoFocus
                       />
                       <div className="flex justify-end gap-2 mt-4">
                         <button onClick={() => setEditingTextNode(null)} className="px-4 py-2 bg-gray-200 rounded text-gray-700 font-semibold">{isAr ? 'إلغاء' : 'Cancel'}</button>
                         <button onClick={() => { updateText(editingTextNode.text); setEditingTextNode(null); }} className="px-4 py-2 bg-indigo-600 rounded text-white font-semibold">{isAr ? 'موافق' : 'Done'}</button>
                       </div>
                    </div>
                  </div>
               )}
            </div>

            {/* Zoom Controls Overlay */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center bg-white dark:bg-slate-800 shadow-xl rounded-full px-4 py-2 border border-gray-200 dark:border-slate-700 gap-4" dir="ltr">
              <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-500 hover:text-indigo-600 transition-colors">
                <Minus size={18} />
              </button>
              <span className="px-2 text-sm font-bold text-gray-700 dark:text-slate-200 w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-500 hover:text-indigo-600 transition-colors">
                <Plus size={18} />
              </button>
            </div>
        </div>
      </div>
    </div>
  );
}

