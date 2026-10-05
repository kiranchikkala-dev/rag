"use client";
import { useNotebooks } from "@/tanstack/queries/notebook.query";
import React from "react";
import NotebookCard from "./notebook-card";

const NotebookGrid = () => {
  const { data: notebooks = [], isLoading, isError } = useNotebooks();

  return (
    <div className="  grid grid-cols-3 gap-2.5 px-10">
      {notebooks?.map((nb) => {
        return <NotebookCard notebook={nb} key={nb.id} />;
      })}
    </div>
  );
};

export default NotebookGrid;
