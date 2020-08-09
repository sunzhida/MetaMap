const HEIGHT = 180;
const WIDTH = 180;
const MIN_H_GUTTER = 20;
const W_GUTTER = 20;

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
 * Image
 * @typedef {Object} Image
 * @property {string} name
 * @property {string[]} keywords
 * @property {number} height
 * @property {number} width 
 */

class TreeNode {
    /**
     * @param {number} id 
     * @param {Image[]} images 
     * @param {object} children 
     * @param {TreeNode} [children.semantic]
     * @param {TreeNode} [children.color]
     * @param {TreeNode} [children.shape]
     */
    constructor(id, images, children) {
        this.id = id;
        this.images = images;
        this.imageIndex = 0;
        this.x = 0;
        this.y = 0;
        this.level = 0;
        children.semantic && (this.semantic = children.semantic);
        children.color && (this.color = children.color);
        children.shape && (this.shape = children.shape);
    }

    /**
     * Get the image to which the imageIndex currently points
     * @returns {Image}
     */
    getImage() {
        return this.images[this.imageIndex];
    }

    /**
     * Increase imageIndex by 1 (can wrap) and returns the new image
     * @returns {Image}
     */
    nextImage() {
        this.imageIndex++;
        if (this.imageIndex >= this.images.length) {
            this.imageIndex %= this.images.length;
        }
        return this.getImage();
    }

    /**
     * Decrease imageIndex by 1 (can wrap) and returns the new image
     * @returns {Image}
     */
    prevImage() {
        this.imageIndex--;
        while (this.imageIndex < 0) {
            this.imageIndex += this.images.length;
        }
        return this.getImage();
    }

    /**
     * Does not modify imageIndex. Returns the previous image,
     * the current image and the next image in an array
     * @returns {[Image, Image, Image]}
     */
    getThreeImages() {
        const prevIdx = this.imageIndex - 1;
        while (prevIdx < 0) {
            prevIdx += this.images.length;
        }
        
        const nextIdx = this.imageIndex + 1;
        if (nextIdx >= this.images.length) {
            nextIdx %= this.images.length;
        }

        return [
            this.images[prevIdx],
            this.images[this.imageIndex],
            this.images[nextIdx],
        ];
    }
};

class ImageTree {
    /**
     * Create an ImageTree instance and
     * optionally initialize it with a DTO
     * @param {DTO} [dto] The DTO for the root node
     */
    constructor(dto) {
        this.idCounter = 0;
        this.tree = undefined;
        if (dto) {
            this.initialize(dto);
        }
    }

    /**
     * Get current tree
     * @returns {TreeNode} Root tree node
     * @throws When called before initialization(dto)
     */
    get() {
        if (!this.tree) throw new Error('Must initialize a tree first');
        return this.tree;
    }

    /**
     * Clear tree and (re-)initialte with a root node
     * Then returns the tree
     * @param {DTO} dto Optional root node
     * @returns {TreeNode} The newly initialized tree
     */
    initialize(dto) {
        this.idCounter = 0;
        this.tree = new TreeNode(
            this.__getId(),
            [{
                name: dto.name,
                keywords: dto.keywords,
                width: dto.width,
                height: dto.height
            }],
            {
                semantic: new TreeNode(
                    this.__getId(),
                    dto.semantic,
                    {},
                ),
                color: new TreeNode(
                    this.__getId(),
                    dto.color,
                    {},
                ),
                shape: new TreeNode(
                    this.__getId(),
                    dto.shape,
                    {},
                ),
            }
        )
        this._updateTreeXY();
        return this.tree;
    }

    /**
     * Find tree node object of given id
     * @param {number} id Tree node id
     * @returns {TreeNode | undefined}
     */
    find(id) {
        return this.__findInner(id, this.tree);
    }

    /**
     * Find the parent tree node of given id
     * If id === 0, i.e. root node, also returns undefined
     * @param {number} id 
     * @returns {TreeNode | undefined}
     */
    findParent(id) {
        if (id === 0) return undefined;
        return this.__findParentInner(id, this.tree);
    }

    /**
     * Explore a tree node given backend dto
     * @param {number} id Tree node id to explore
     * @param {DTO} dto Explore result provided by backend
     * @returns {TreeNode} The updated tree
     * @throws When id not found
     */
    explore(id, dto) {
        const found = this.find(id);
        if (!found) throw new Error(`[explore] id ${id} not found`);
        found.semantic = new TreeNode(
            this.__getId(),
            dto.semantic,
            {}
        );
        found.color = new TreeNode(
            this.__getId(),
            dto.color,
            {}
        );
        found.shape = new TreeNode(
            this.__getId(),
            dto.shape,
            {}
        );
        this._updateTreeXY();
        return this.tree;
    }

    /**
     * Remove a tree node
     * @param {number} id Tree node id to remove
     * @returns {TreeNode} The updated tree
     * @throws When id not found
     */
    remove(id) {
        const parent = this.findParent(id);
        if (!parent) throw new Error(`[remove] id ${id} not found`);
        if (parent.semantic && parent.semantic.id === id) {
            delete parent.semantic;
        } else if (parent.color && parent.color.id === id) {
            delete parent.color;
        } else if (parent.shape && parent.shape.id === id) {
            delete parent.shape;
        }
        this._updateTreeXY();
        return this.tree;
    }

    /**
     * Force update x, y, level properties of each tree node
     * This step should be automatically done inside initialize, explore and remove
     * Unless you really need a force update
     * @returns {number} Tree level
     */
    _updateTreeXY() {
        const totalLevel = this.__injectTreeLevel(this.tree, 0);

        const gutters = Array.from({ length: totalLevel + 1 });
        gutters[0] = 0;
        gutters[totalLevel] = MIN_H_GUTTER;
        for (let lev = totalLevel - 1; lev > 0; lev--) {
            gutters[lev] = 2 * HEIGHT + 3 * gutters[lev + 1];
        }
    
        this.__injectTreeHeight(this.tree, 0, gutters);
        return totalLevel;
    }

    /**
     * @private
     * @returns {number}
     */
    __getId() {
        return this.idCounter++;
    }

    /**
     * @private
     * @param {number} id 
     * @param {TreeNode | undefined} cur 
     * @returns {TreeNode | undefined}
     */
    __findInner(id, cur) {
        if (!cur) return undefined;
        if (cur.id === id) return cur;
        return this.__findInner(id, cur.semantic)
            || this.__findInner(id, cur.color)
            || this.__findInner(id, cur.shape);
    }

    /**
     * @private
     * @param {number} id 
     * @param {TreeNode | undefined} cur 
     * @returns {TreeNode | undefined}
     */
    __findParentInner(id, cur) {
        if (!cur) return undefined;
        if ((cur.semantic && cur.semantic.id == id)
            || (cur.color && cur.color.id == id)
            || (cur.shape && cur.shape.id == id))
            return cur;
        return this.__findParentInner(id, cur.semantic)
            || this.__findParentInner(id, cur.color)
            || this.__findParentInner(id, cur.shape);
    }

    /**
     * @private
     * @param {TreeNode} node 
     * @param {number} cur Current level
     */
    __injectTreeLevel(node, cur) {
        node.level = cur;
        node.x = cur * (WIDTH + W_GUTTER);
        const r1 = node.semantic ? this.__injectTreeLevel(node.semantic, cur + 1) : cur;
        const r2 = node.color ? this.__injectTreeLevel(node.color, cur + 1) : cur;
        const r3 = node.shape ? this.__injectTreeLevel(node.shape, cur + 1) : cur;
        return Math.max(r1, r2, r3);
    }

    /**
     * @private
     * @param {TreeNode} node 
     * @param {number} curY 
     * @param {number[]} H_GUTTERS 
     */
    __injectTreeHeight(node, curY, H_GUTTERS) {
        node.y = curY;
        const nextGap = H_GUTTERS[node.level + 1] + HEIGHT;
        node.semantic && this.__injectTreeHeight(node.semantic, curY - nextGap, H_GUTTERS);
        node.color && this.__injectTreeHeight(node.color, curY, H_GUTTERS);
        node.shape && this.__injectTreeHeight(node.shape, curY + nextGap, H_GUTTERS);
    }
}
