import React, { useRef, useEffect, useState, useMemo } from "react";
import "./App.css";
import styled from "styled-components";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import uuid from "uuid";
import _ from "lodash";

const BlockContainer = styled(motion.div)`
  width: 100%;
  height: 48px;
  background-color: ${(props) => (props.active ? "black" : "blue")};
  border: 4px solid red;
`;

const StackContainer = styled.div`
  width: 100%;
  height: 48px;
`;

function lerp(a, b, t) {
  return (1 - t) * a + t * b;
}

const Divider = styled.div`
  width: 100%;
  height: 5px;
  background-color: ${(props) => (props.active ? "#2B95D6" : "transparent")};
  transition: background-color 0.2s ease;
`;

const Stack = ({ children, blocks: initBlocks = [] }) => {
  const [blocks, setBlocks] = useState({});
  const [draggingBlock, setDraggingBlock] = useState({ key: null });
  const [blockOrder, setBlockOrder] = useState([]);
  const [activeDivider, setActiveDivider] = useState({ key: null, index: -1 });

  useEffect(() => {
    const obj = {};
    for (let i = 0; i < initBlocks.length; ++i) {
      obj[initBlocks[i]] = { ref: React.createRef() };
    }
    setBlocks(obj);
    setBlockOrder(initBlocks);
  }, [initBlocks]);

  function onChildDragEnd(childId) {
    return function (blockAnimation) {
      return function (e) {
        blockAnimation.start({ x: 0, y: 0 });

        if (activeDivider.key !== null) {
          const before = blockOrder
            .slice(0, activeDivider.index + 1)
            .filter((key) => key !== draggingBlock);

          const after = blockOrder
            .slice(activeDivider.index + 1)
            .filter((key) => key !== draggingBlock);

          console.log([...before, draggingBlock, ...after], activeDivider);

          setBlockOrder([...before, draggingBlock, ...after]);
          setDraggingBlock({ key: null });
          setActiveDivider({ key: null, index: -1 });
        }
      };
    };
  }

  function onChildDragStart(childId) {
    return function (blockAnimation) {
      return function (e) {
        console.log(childId);
        setDraggingBlock(childId);
      };
    };
  }

  function onChildDrag(childId) {
    return function (e) {
      const positionsWithCurrent = blockOrder
        .filter((key) => !!blocks[key].ref)
        .map((key, index) => [
          key,
          blocks[key].ref.current.getBoundingClientRect(),
          index,
        ]);

      const positions = positionsWithCurrent.filter(([id]) => id !== childId);

      const target = e.target;
      const mouseX = e.pageX;
      const mouseY = e.pageY;

      const [key, rect, ogIndex] =
        positions.find(
          ([, rect]) => lerp(rect.top, rect.bottom, 0.5) > mouseY
        ) || _.last(positions);

      const prevIndex = Math.max(0, ogIndex - 1);
      const [prevKey] = positionsWithCurrent[prevIndex];

      const midY = lerp(rect.top, rect.bottom, 0.5);
      const isTop = mouseY < midY;

      if (isTop) {
        setActiveDivider(
          prevKey === childId
            ? { key: null, index: -1 }
            : { key: prevKey, index: prevIndex }
        );
      } else {
        setActiveDivider({ key, index: ogIndex });
      }
    };
  }

  return (
    <StackContainer>
      {/* <Divider /> */}
      <AnimatePresence>
        {blockOrder.map((key, index) => {
          return (
            <motion.div key={key} positionTransition>
              <Block
                val={key}
                innerRef={blocks[key].ref}
                onDrag={onChildDrag(key)}
                onDragEnd={onChildDragEnd(key)}
                onDragStart={onChildDragStart(key)}
              />
              <Divider active={key === activeDivider.key} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </StackContainer>
  );
};

const Block = ({
  innerRef: ref,
  onDrag,
  onDragEnd,
  onDragStart,
  val,
  active,
}) => {
  const blockAnimation = useAnimation();

  return (
    <BlockContainer
      active={active}
      ref={ref}
      onDrag={onDrag}
      animate={blockAnimation}
      onDragEnd={onDragEnd(blockAnimation)}
      onDragStart={onDragStart(blockAnimation)}
      drag
      dragMomentum={false}
    >
      {val}
    </BlockContainer>
  );
};

function App() {
  return (
    <div className="App">
      <Stack blocks={[uuid(), uuid(), uuid()]} />
    </div>
  );
}

export default App;
