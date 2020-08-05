const HEIGHT = 180;
const MIN_H_GUTTER = 20;

function _injectTreeHeight_inner(node, cur) {
    node.level = cur;
    if (node.children) {
        const r1 = _injectTreeHeight_inner(node.children[0], cur + 1);
        const r2 = _injectTreeHeight_inner(node.children[1], cur + 1);
        const r3 = _injectTreeHeight_inner(node.children[2], cur + 1);
        return Math.max(r1, r2, r3);
    }
    return cur;
}

function _injectTreeDim(rootNode, H_GUTTERS) {
    _injectTreeDim_inner(rootNode, 0, H_GUTTERS)
}

function _injectTreeDim_inner(node, curY, H_GUTTERS) {
    node.y = curY;
    if (node.children) {
        const nextGutter = H_GUTTERS[node.level + 1] + HEIGHT;
        _injectTreeDim_inner(node.children[1], curY, H_GUTTERS);
        _injectTreeDim_inner(node.children[0], curY - nextGutter, H_GUTTERS);
        _injectTreeDim_inner(node.children[2], curY + nextGutter, H_GUTTERS);
    }
}

/**
 * 计算图片树的深度，顺便给每个object注入一个level属性
 * @param {object} rootNode 根图片object
 * @returns {number} 图片树的深度
 */
function calculateTreeLevel(rootNode) {
    return _injectTreeHeight_inner(rootNode, 0);
}

/**
 * 计算图片树中每一个图片的y位置，以根图片为0基准。
 * 计算得到的y值会注入到每一个object的y属性上。
 * 顺便为每一个object注入level属性，并返回图片树的深度。
 * @param {object} rootNode 根图片object
 * @returns {number} 图片树的深度
 */
function calculateTreeDim(rootNode) {
    const totalLevel = calculateTreeLevel(rootNode);

    const gutters = Array.from({ length: totalLevel + 1 });
    gutters[0] = 0;
    gutters[totalLevel] = MIN_H_GUTTER;
    for (let lev = totalLevel - 1; lev > 0; lev--) {
        gutters[lev] = 2 * HEIGHT + 3 * gutters[lev + 1];
    }

    _injectTreeDim(rootNode, gutters);
    return totalLevel;
}
