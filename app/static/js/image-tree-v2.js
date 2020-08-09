const HEIGHT = 180;
const WIDTH = 180;
const MIN_H_GUTTER = 20;
const W_GUTTER = 20;

/**
 * Image
 * @typedef {Object} Image
 * @property {string} name
 * @property {string[]} keywords
 * @property {number} height
 * @property {number} width 
 */
/**
 * TreeNode
 * @typedef {Object} TreeNode
 * @property {number} id
 * @property {Image[]} images
 * @property {number} imageIndex
 * @property {TreeNode} [semantic]
 * @property {TreeNode} [color]
 * @property {TreeNode} [shape]
 * @property {number} x
 * @property {number} y
 * @property {number} level
 */
/**
 * DTO - Data Transfer Object (btw frontend & backend)
 * @typedef {Object} DTO
 * @property {string} name
 * @property {string[]} keywords
 * @property {number} height
 * @property {number} width
 * @property {Image[]} semantic
 * @property {Image[]} color
 * @property {Image[]} shape
 */

/**
 * ImageTree engine
 * @namespace
 */
const ImageTree = (function() {
    let idCounter = 0;

    /** @type {TreeNode} */
    let tree;

    /**
     * Get current tree
     * @returns {TreeNode} Root tree node
     * @throws When called before initialize(dto)
     */
    function get() {
        if (!tree) throw new Error('Must initialize a tree first');
        return tree;
    }

    function _getId() {
        return idCounter++;
    }

    /**
     * Clear tree and (re-)initialte with a root node
     * Then returns the tree
     * @param {DTO} dto Optional root node
     * @returns {TreeNode} The newly initialized tree
     */
    function initialize(dto) {
        idCounter = 0;
        tree = {
            id: _getId(),
            images: [{
                name: dto.name,
                keywords: dto.keywords,
                width: dto.width,
                height: dto.height
            }],
            imageIndex: 0,
            semantic: {
                id: _getId(),
                images: dto.semantic,
                imageIndex: 0,
            },
            color: {
                id: _getId(),
                images: dto.color,
                imageIndex: 0,
            },
            shape: {
                id: _getId(),
                images: dto.shape,
                imageIndex: 0,
            }
        };
        _updateTreeXY();
        return tree;
    }

    /**
     * @param {number} id 
     * @param {TreeNode | undefined} cur 
     * @returns {TreeNode | undefined}
     */
    function __findInner(id, cur) {
        if (!cur) return undefined;
        if (cur.id === id) return cur;
        return __findInner(id, cur.semantic)
            || __findInner(id, cur.color)
            || __findInner(id, cur.shape);
    }

    /**
     * Find tree node object of given id
     * @param {number} id Tree node id
     * @returns {TreeNode | undefined}
     */
    function find(id) {
        return __findInner(id, tree);
    }
    
    /**
     * @param {number} id 
     * @param {TreeNode | undefined} cur 
     * @returns {TreeNode | undefined}
     */
    function __findParentInner(id, cur) {
        if (!cur) return undefined;
        if ((cur.semantic && cur.semantic.id == id)
            || (cur.color && cur.color.id == id)
            || (cur.shape && cur.shape.id == id))
            return cur;
        return __findParentInner(id, cur.semantic)
            || __findParentInner(id, cur.color)
            || __findParentInner(id, cur.shape);
    }

    /**
     * Find the parent tree node of given id
     * If id === 0, i.e. root node, also returns undefined
     * @param {number} id 
     * @returns {TreeNode | undefined}
     */
    function findParent(id) {
        if (id === 0) return undefined;
        return __findParentInner(id, tree);
    }

    /**
     * Explore a tree node given backend dto
     * @param {number} id Tree node id to explore
     * @param {DTO} dto Explore result provided by backend
     * @returns {TreeNode} The updated tree
     * @throws When id not found
     */
    function explore(id, dto) {
        const found = find(id);
        if (!found) throw new Error(`[explore] id ${id} not found`);
        found.semantic = {
            id: _getId(),
            images: dto.semantic,
            imageIndex: 0,
        };
        found.color = {
            id: _getId(),
            images: dto.semantic,
            imageIndex: 0,
        };
        found.shape = {
            id: _getId(),
            images: dto.shape,
            imageIndex: 0,
        };
        _updateTreeXY();
        return tree;
    }

    /**
     * Remove a tree node
     * @param {number} id Tree node id to remove
     * @returns {TreeNode} The updated tree
     * @throws When id not found
     */
    function remove(id) {
        const parent = findParent(id);
        if (!parent) throw new Error(`[remove] id ${id} not found`);
        if (parent.semantic && parent.semantic.id === id) {
            delete parent.semantic;
        } else if (parent.color && parent.color.id === id) {
            delete parent.color;
        } else if (parent.shape && parent.shape.id === id) {
            delete parent.shape;
        }
        _updateTreeXY();
        return tree;
    }

    /**
     * @param {TreeNode} node 
     * @param {number} cur Current level
     */
    function __injectTreeLevel(node, cur) {
        node.level = cur;
        node.x = cur * (WIDTH + W_GUTTER);
        const r1 = node.semantic ? __injectTreeLevel(node.semantic, cur + 1) : cur;
        const r2 = node.color ? __injectTreeLevel(node.color, cur + 1) : cur;
        const r3 = node.shape ? __injectTreeLevel(node.shape, cur + 1) : cur;
        return Math.max(r1, r2, r3);
    }

    /**
     * @param {TreeNode} node 
     * @param {number} curY 
     * @param {number[]} H_GUTTERS 
     */
    function __injectTreeHeight(node, curY, H_GUTTERS) {
        node.y = curY;
        const nextGap = H_GUTTERS[node.level + 1] + HEIGHT;
        node.semantic && __injectTreeHeight(node.semantic, curY - nextGap, H_GUTTERS);
        node.color && __injectTreeHeight(node.color, curY, H_GUTTERS);
        node.shape && __injectTreeHeight(node.shape, curY + nextGap, H_GUTTERS);
    }

    /**
     * Force update x, y, level properties of each tree node
     * This step should be automatically done inside initialize, explore and remove
     * Unless you really need a force update
     * @returns {number} Tree level
     */
    function _updateTreeXY() {
        const totalLevel = __injectTreeLevel(tree, 0);

        const gutters = Array.from({ length: totalLevel + 1 });
        gutters[0] = 0;
        gutters[totalLevel] = MIN_H_GUTTER;
        for (let lev = totalLevel - 1; lev > 0; lev--) {
            gutters[lev] = 2 * HEIGHT + 3 * gutters[lev + 1];
        }
    
        __injectTreeHeight(tree, 0, gutters);
        return totalLevel;
    }

    return {
        get,
        initialize,
        find,
        findParent,
        explore,
        remove,
        _updateTreeXY,
    }
})();
