'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FILE_ZONES } from '@/lib/schema/value-lists';
import type { FileZone } from '@/lib/schema/value-lists';

const ACCEPTED_TYPES = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
  'application/pdf': ['.pdf'],
};

interface FileDropZoneProps {
  files: Record<string, File | null>;
  onChange: (files: Record<string, File | null>) => void;
}

export function FileDropZone({ files, onChange }: FileDropZoneProps) {
  const handleDrop = useCallback(
    (zone: FileZone, accepted: File[]) => {
      if (accepted.length > 0) {
        onChange({ ...files, [zone]: accepted[0] });
      }
    },
    [files, onChange]
  );

  const handleRemove = useCallback(
    (zone: FileZone) => {
      onChange({ ...files, [zone]: null });
    },
    [files, onChange]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          File Upload
        </h3>
        <p className="text-sm text-muted-foreground">
          Upload supporting documents for automated data extraction. Accepts
          .xlsx, .xls, .csv, and .pdf files.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {FILE_ZONES.map((zone) => (
          <DropTarget
            key={zone}
            zone={zone}
            file={files[zone] ?? null}
            onDrop={(accepted) => handleDrop(zone, accepted)}
            onRemove={() => handleRemove(zone)}
          />
        ))}
      </div>
    </div>
  );
}

function DropTarget({
  zone,
  file,
  onDrop,
  onRemove,
}: {
  zone: FileZone;
  file: File | null;
  onDrop: (files: File[]) => void;
  onRemove: () => void;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        group relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer
        ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : file
              ? 'border-primary/40 bg-primary/5'
              : 'border-input hover:border-primary/40 hover:bg-muted/50'
        }
      `}
    >
      <input {...getInputProps()} />

      {file ? (
        <>
          <FileSpreadsheet className="size-8 text-primary" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            className="absolute top-2 right-2"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <X className="size-3.5" />
          </Button>
        </>
      ) : (
        <>
          <Upload
            className={`size-8 ${
              isDragActive ? 'text-primary' : 'text-muted-foreground'
            }`}
          />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{zone}</p>
            <p className="text-xs text-muted-foreground">
              Drop file here or click to browse
            </p>
          </div>
        </>
      )}
    </div>
  );
}
