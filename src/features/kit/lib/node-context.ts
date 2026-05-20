import { createContext, useContext } from "react";

export const NodeContext = createContext<{ readOnly: boolean }>({ readOnly: false });

export const useNodeContext = () => useContext(NodeContext);
