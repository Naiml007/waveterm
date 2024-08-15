// Copyright 2024, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

import clsx from "clsx";
import { toPng } from "html-to-image";
import { Atom, useAtomValue, useSetAtom } from "jotai";
import React, {
    CSSProperties,
    ReactNode,
    Suspense,
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { DropTargetMonitor, XYCoord, useDrag, useDragLayer, useDrop } from "react-dnd";
import { debounce, throttle } from "throttle-debounce";
import { useDevicePixelRatio } from "use-device-pixel-ratio";
import { LayoutModel, ResizeHandleProps } from "./layoutModel";
import { useLayoutNode, useTileLayout } from "./layoutModelHooks";
import "./tilelayout.less";
import { LayoutNode, LayoutTreeActionType, LayoutTreeComputeMoveNodeAction, TileLayoutContents } from "./types";
import { determineDropDirection } from "./utils";

export interface TileLayoutProps {
    /**
     * The atom containing the layout tree state.
     */
    tabAtom: Atom<Tab>;

    /**
     * callbacks and information about the contents (or styling) of the TileLayout or contents
     */
    contents: TileLayoutContents;

    /**
     * A callback for getting the cursor point in reference to the current window. This removes Electron as a runtime dependency, allowing for better integration with Storybook.
     * @returns The cursor position relative to the current window.
     */
    getCursorPoint?: () => Point;
}

const DragPreviewWidth = 300;
const DragPreviewHeight = 300;

function TileLayoutComponent({ tabAtom, contents, getCursorPoint }: TileLayoutProps) {
    const layoutModel = useTileLayout(tabAtom, contents);
    const generation = useAtomValue(layoutModel.generationAtom);
    const overlayTransform = useAtomValue(layoutModel.overlayTransform);
    const setActiveDrag = useSetAtom(layoutModel.activeDrag);
    const setReady = useSetAtom(layoutModel.ready);
    const isResizing = useAtomValue(layoutModel.isResizing);

    const { activeDrag, dragClientOffset } = useDragLayer((monitor) => ({
        activeDrag: monitor.isDragging(),
        dragClientOffset: monitor.getClientOffset(),
    }));

    useEffect(() => {
        console.log("activeDrag", activeDrag);
        setActiveDrag(activeDrag);
    }, [setActiveDrag, activeDrag]);

    const checkForCursorBounds = useCallback(
        debounce(100, (dragClientOffset: XYCoord) => {
            const cursorPoint = dragClientOffset ?? getCursorPoint?.();
            if (cursorPoint && layoutModel.displayContainerRef?.current) {
                const displayContainerRect = layoutModel.displayContainerRef.current.getBoundingClientRect();
                const normalizedX = cursorPoint.x - displayContainerRect.x;
                const normalizedY = cursorPoint.y - displayContainerRect.y;
                if (
                    normalizedX <= 0 ||
                    normalizedX >= displayContainerRect.width ||
                    normalizedY <= 0 ||
                    normalizedY >= displayContainerRect.height
                ) {
                    layoutModel.treeReducer({ type: LayoutTreeActionType.ClearPendingAction });
                }
            }
        }),
        [getCursorPoint, generation]
    );

    // Effect to detect when the cursor leaves the TileLayout hit trap so we can remove any placeholders. This cannot be done using pointer capture
    // because that conflicts with the DnD layer.
    useEffect(() => checkForCursorBounds(dragClientOffset), [dragClientOffset]);

    // Ensure that we don't see any jostling in the layout when we're rendering it the first time.
    // `animate` will be disabled until after the transforms have all applied the first time.
    const [animate, setAnimate] = useState(false);
    useEffect(() => {
        setReady(false);
        setTimeout(() => {
            setAnimate(true);
            setReady(true);
        }, 50);
    }, []);

    const tileStyle = useMemo(
        () => ({ "--gap-size-px": `${layoutModel.gapSizePx}px` }) as CSSProperties,
        [layoutModel.gapSizePx]
    );

    return (
        <Suspense>
            <div
                className={clsx("tile-layout", contents.className, { animate: animate && !isResizing })}
                style={tileStyle}
            >
                <div key="display" ref={layoutModel.displayContainerRef} className="display-container">
                    <DisplayNodesWrapper contents={contents} layoutModel={layoutModel} />
                    <ResizeHandleWrapper layoutModel={layoutModel} />
                </div>
                <Placeholder key="placeholder" layoutModel={layoutModel} style={{ top: 10000, ...overlayTransform }} />
                <OverlayNodeWrapper layoutModel={layoutModel} />
            </div>
        </Suspense>
    );
}

export const TileLayout = memo(TileLayoutComponent) as typeof TileLayoutComponent;

interface DisplayNodesWrapperProps {
    /**
     * The layout tree state.
     */
    layoutModel: LayoutModel;
    /**
     * contains callbacks and information about the contents (or styling) of of the TileLayout
     */
    contents: TileLayoutContents;
}

const DisplayNodesWrapper = ({ layoutModel, contents }: DisplayNodesWrapperProps) => {
    const generation = useAtomValue(layoutModel.generationAtom);

    return useMemo(
        () =>
            layoutModel.leafs.map((leaf) => {
                return (
                    <DisplayNode
                        className={clsx({ magnified: layoutModel.treeState.magnifiedNodeId === leaf.id })}
                        key={leaf.id}
                        layoutModel={layoutModel}
                        layoutNode={leaf}
                        contents={contents}
                    />
                );
            }),
        [generation]
    );
};

interface DisplayNodeProps {
    layoutModel: LayoutModel;
    /**
     * The leaf node object, containing the data needed to display the leaf contents to the user.
     */
    layoutNode: LayoutNode;

    /**
     * contains callbacks and information about the contents (or styling) of of the TileLayout
     */
    contents: TileLayoutContents;

    /**
     * Any class names to add to the component.
     */
    className?: string;
}

const dragItemType = "TILE_ITEM";

/**
 * The draggable and displayable portion of a leaf node in a layout tree.
 */
const DisplayNode = ({ layoutModel, layoutNode, contents, className }: DisplayNodeProps) => {
    const tileNodeRef = useRef<HTMLDivElement>(null);
    const dragHandleRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const addlProps = useLayoutNode(layoutModel, layoutNode);
    const activeDrag = useAtomValue(layoutModel.activeDrag);
    const globalReady = useAtomValue(layoutModel.ready);
    const layoutGeneration = useAtomValue(layoutModel.generationAtom);

    const devicePixelRatio = useDevicePixelRatio();

    const [{ isDragging }, drag, dragPreview] = useDrag(
        () => ({
            type: dragItemType,
            item: () => layoutNode,
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
        }),
        [layoutNode]
    );

    const [previewElementGeneration, setPreviewElementGeneration] = useState(0);
    const previewElement = useMemo(() => {
        setPreviewElementGeneration(previewElementGeneration + 1);
        return (
            <div key="preview" className="tile-preview-container">
                <div
                    className="tile-preview"
                    ref={previewRef}
                    style={{
                        width: DragPreviewWidth,
                        height: DragPreviewHeight,
                        transform: `scale(${1 / devicePixelRatio})`,
                    }}
                >
                    {contents.renderPreview?.(layoutNode.data)}
                </div>
            </div>
        );
    }, [contents.renderPreview, devicePixelRatio, layoutNode.data]);

    const [previewImage, setPreviewImage] = useState<HTMLImageElement>(null);
    const [previewImageGeneration, setPreviewImageGeneration] = useState(0);
    const generatePreviewImage = useCallback(() => {
        const offsetX = (DragPreviewWidth * devicePixelRatio - DragPreviewWidth) / 2 + 10;
        const offsetY = (DragPreviewHeight * devicePixelRatio - DragPreviewHeight) / 2 + 10;
        if (previewImage !== null && previewElementGeneration === previewImageGeneration) {
            dragPreview(previewImage, { offsetY, offsetX });
        } else if (previewRef.current) {
            setPreviewImageGeneration(previewElementGeneration);
            toPng(previewRef.current).then((url) => {
                const img = new Image();
                img.src = url;
                setPreviewImage(img);
                dragPreview(img, { offsetY, offsetX });
            });
        }
    }, [
        dragPreview,
        previewRef.current,
        previewElementGeneration,
        previewImageGeneration,
        previewImage,
        devicePixelRatio,
        layoutNode.data,
    ]);

    // Register the tile item as a draggable component
    useEffect(() => {
        drag(dragHandleRef);
    }, [drag, dragHandleRef.current]);

    const leafContent = useMemo(() => {
        return (
            layoutNode.data && (
                <div key="leaf" className="tile-leaf">
                    {contents.renderContent(
                        layoutNode.data,
                        globalReady,
                        layoutNode.id === layoutModel.treeState.magnifiedNodeId,
                        activeDrag,
                        () => layoutModel.magnifyNode(layoutNode),
                        () => layoutModel.closeNode(layoutNode),
                        dragHandleRef
                    )}
                </div>
            )
        );
    }, [layoutNode, globalReady, layoutGeneration, activeDrag, addlProps]);

    return (
        <div
            className={clsx("tile-node", className, { dragging: isDragging })}
            ref={tileNodeRef}
            id={layoutNode.id}
            style={addlProps?.transform}
            onPointerEnter={generatePreviewImage}
            onPointerOver={(event) => event.stopPropagation()}
        >
            {leafContent}
            {previewElement}
        </div>
    );
};

interface OverlayNodeWrapperProps {
    layoutModel: LayoutModel;
}

const OverlayNodeWrapper = ({ layoutModel }: OverlayNodeWrapperProps) => {
    const generation = useAtomValue(layoutModel.generationAtom);
    const overlayTransform = useAtomValue(layoutModel.overlayTransform);

    const overlayNodes = useMemo(
        () =>
            layoutModel.leafs.map((leaf) => {
                return <OverlayNode key={leaf.id} layoutModel={layoutModel} layoutNode={leaf} />;
            }),
        [generation]
    );

    return (
        <div key="overlay" className="overlay-container" style={{ top: 10000, ...overlayTransform }}>
            {overlayNodes}
        </div>
    );
};

interface OverlayNodeProps {
    /**
     * The layout node object corresponding to the OverlayNode.
     */
    layoutNode: LayoutNode;
    /**
     * The layout tree state.
     */
    layoutModel: LayoutModel;
}

/**
 * An overlay representing the true flexbox layout of the LayoutTreeState. This holds the drop targets for moving around nodes and is used to calculate the
 * dimensions of the corresponding DisplayNode for each LayoutTreeState leaf.
 */
const OverlayNode = ({ layoutNode, layoutModel }: OverlayNodeProps) => {
    const additionalProps = useLayoutNode(layoutModel, layoutNode);
    const overlayRef = useRef<HTMLDivElement>(null);
    const generation = useAtomValue(layoutModel.generationAtom);
    const pendingAction = useAtomValue(layoutModel.pendingAction.throttledValueAtom);

    const [, drop] = useDrop(
        () => ({
            accept: dragItemType,
            canDrop: (_, monitor) => {
                const dragItem = monitor.getItem<LayoutNode>();
                if (monitor.isOver({ shallow: true }) && dragItem?.id !== layoutNode.id) {
                    return true;
                }
                return false;
            },
            drop: (_, monitor) => {
                // console.log("drop start", layoutNode.id, layoutTreeState.pendingAction);
                if (!monitor.didDrop() && pendingAction) {
                    layoutModel.treeReducer({
                        type: LayoutTreeActionType.CommitPendingAction,
                    });
                }
            },
            hover: throttle(30, (_, monitor: DropTargetMonitor<unknown, unknown>) => {
                if (monitor.isOver({ shallow: true })) {
                    if (monitor.canDrop() && layoutModel.displayContainerRef?.current) {
                        const dragItem = monitor.getItem<LayoutNode>();
                        // console.log("computing operation", layoutNode, dragItem, additionalProps.rect);
                        const offset = monitor.getClientOffset();
                        const containerRect = layoutModel.displayContainerRef.current?.getBoundingClientRect();
                        offset.x -= containerRect?.x;
                        offset.y -= containerRect?.y;
                        layoutModel.treeReducer({
                            type: LayoutTreeActionType.ComputeMove,
                            node: layoutNode,
                            nodeToMove: dragItem,
                            direction: determineDropDirection(additionalProps?.rect, offset),
                        } as LayoutTreeComputeMoveNodeAction);
                    } else {
                        layoutModel.treeReducer({
                            type: LayoutTreeActionType.ClearPendingAction,
                        });
                    }
                }
            }),
        }),
        [layoutNode, pendingAction, generation, additionalProps, layoutModel.displayContainerRef]
    );

    // Register the tile item as a draggable component
    useEffect(() => {
        drop(overlayRef);
    }, []);

    return <div ref={overlayRef} className="overlay-node" id={layoutNode.id} style={additionalProps?.transform} />;
};

interface ResizeHandleWrapperProps {
    layoutModel: LayoutModel;
}

const ResizeHandleWrapper = ({ layoutModel }: ResizeHandleWrapperProps) => {
    const resizeHandles = useAtomValue(layoutModel.resizeHandles) as Atom<ResizeHandleProps>[];

    return resizeHandles.map((resizeHandleAtom, i) => (
        <ResizeHandle key={`resize-handle-${i}`} layoutModel={layoutModel} resizeHandleAtom={resizeHandleAtom} />
    ));
};

interface ResizeHandleComponentProps {
    resizeHandleAtom: Atom<ResizeHandleProps>;
    layoutModel: LayoutModel;
}

const ResizeHandle = ({ resizeHandleAtom, layoutModel }: ResizeHandleComponentProps) => {
    const resizeHandleProps = useAtomValue(resizeHandleAtom);
    const resizeHandleRef = useRef<HTMLDivElement>(null);

    // The pointer currently captured, or undefined.
    const [trackingPointer, setTrackingPointer] = useState<number>(undefined);

    // Calculates the new size of the two nodes on either side of the handle, based on the position of the cursor
    const handlePointerMove = useCallback(
        throttle(10, (event: React.PointerEvent<HTMLDivElement>) => {
            if (trackingPointer === event.pointerId) {
                const { clientX, clientY } = event;
                layoutModel.onResizeMove(resizeHandleProps, clientX, clientY);
            }
        }),
        [trackingPointer, layoutModel.onResizeMove, resizeHandleProps]
    );

    // We want to use pointer capture so the operation continues even if the pointer leaves the bounds of the handle
    function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
        resizeHandleRef.current?.setPointerCapture(event.pointerId);
    }

    // This indicates that we're ready to start tracking the resize operation via the pointer
    function onPointerCapture(event: React.PointerEvent<HTMLDivElement>) {
        setTrackingPointer(event.pointerId);
    }

    // We want to wait a bit before committing the pending resize operation in case some events haven't arrived yet.
    const onPointerRelease = useCallback(
        debounce(30, (event: React.PointerEvent<HTMLDivElement>) => {
            setTrackingPointer(undefined);
            layoutModel.onResizeEnd();
        }),
        [layoutModel]
    );

    return (
        <div
            ref={resizeHandleRef}
            className={clsx("resize-handle", `flex-${resizeHandleProps.flexDirection}`)}
            onPointerDown={onPointerDown}
            onGotPointerCapture={onPointerCapture}
            onLostPointerCapture={onPointerRelease}
            style={resizeHandleProps.transform}
            onPointerMove={handlePointerMove}
        >
            <div className="line" />
        </div>
    );
};

interface PlaceholderProps {
    /**
     * The layout tree state.
     */
    layoutModel: LayoutModel;
    /**
     * Any styling to apply to the placeholder container div.
     */
    style: React.CSSProperties;
}

/**
 * An overlay to preview pending actions on the layout tree.
 */
const Placeholder = memo(({ layoutModel, style }: PlaceholderProps) => {
    const [placeholderOverlay, setPlaceholderOverlay] = useState<ReactNode>(null);
    const placeholderTransform = useAtomValue(layoutModel.placeholderTransform);

    useEffect(() => {
        if (placeholderTransform) {
            setPlaceholderOverlay(<div className="placeholder" style={placeholderTransform} />);
        } else {
            setPlaceholderOverlay(null);
        }
    }, [placeholderTransform]);

    return (
        <div className="placeholder-container" style={style}>
            {placeholderOverlay}
        </div>
    );
});
