"use client";

import { Button, SearchField } from "@heroui/react";
import { useState } from "react";

interface OpsHeaderProps {
  search: string;
  onSearchChange: (search: string) => void;
}

export default function OpsHeader({ search, onSearchChange }: OpsHeaderProps) {
  const [localSearch, setLocalSearch] = useState(search);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localSearch);
  };

  return (
    <div className="flex items-center gap-4 mb-6">
      <form onSubmit={handleSubmit} className="flex-1 max-w-md">
        <SearchField
          name="search"
          value={localSearch}
          onChange={setLocalSearch}
          className="w-full"
          aria-label="Search session IDs"
        >
          <SearchField.Input placeholder="Search session IDs..." />
        </SearchField>
      </form>
      {search && (
        <Button
          variant="secondary"
          size="sm"
          onPress={() => {
            setLocalSearch("");
            onSearchChange("");
          }}
        >
          Clear search
        </Button>
      )}
    </div>
  );
}
