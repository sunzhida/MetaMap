# MetaBoard

## Data Structure
### Explore
```javascript
input: img_name
return: a dictionary
d = {
        "name": "01.jpg",
        "keywords": ["xxx", "health", "health", "health"],
        "width": 276,
        "height": 180,
        "semantic": [{
            "name": "000e74ea347f08c0cae2b3cfc4f612cf.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 276,
            "height": 180
        }, {
            "name": "00a8885948a4a3abed0a27480c9f3fa6.png",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 240,
            "height": 180
        }, {
            "name": "00a5155ce76792c8aaef4bd67e2d4f44.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 232,
            "height": 180
        }],
        "color": [{
            "name": "00ab0fe3d1d76da690d7438117eeea49.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 270,
            "height": 180
        }, {
            "name": "00e43e295097e2580d0178cb3cadd04b.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 131,
            "height": 180
        }],
        "shape": [{
            "name": "00daeeb00b31e6f7fd9bf103a1733560.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 131,
            "height": 180
        }, {
            "name": "00dddfdfe4ad349925af78c3d04533f9.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 116,
            "height": 180
        }],
        "status": "xxx"
    }
```

### 前端图树状态存储
树的结构长这样
```javascript
{
    id: 0,
    images: [ { name: '01.jpg', keywords: ['fuck'], width: 200, height: 200 } ],
    imageIndex: 0,
    semantic: {
        id: 1,
        images: [
            {
                name: "000e74ea347f08c0cae2b3cfc4f612cf.jpg",
                keywords: ["xxx", "health", "health", "health"],
                width: 276,
                height: 180
            },
            {
                name: "00a8885948a4a3abed0a27480c9f3fa6.png",
                keywords: ["xxx", "health", "health", "health"],
                width: 240,
                height: 180
            },
            {
                name: "00a5155ce76792c8aaef4bd67e2d4f44.jpg",
                keywords: ["xxx", "health", "health", "health"],
                width: 232,
                height: 180
            }
        ],
        imageIndex: 0,
        level: 1,
        x: 200,
        y: -200,
    },
    color: {
        id: 2,
        images: [
            {
                name: "00ab0fe3d1d76da690d7438117eeea49.jpg",
                keywords: ["xxx", "health", "health", "health"],
                width: 270,
                height: 180
            },
            {
                name: "00e43e295097e2580d0178cb3cadd04b.jpg",
                keywords: ["xxx", "health", "health", "health"],
                width: 131,
                height: 180
            }
        ],
        imageIndex: 0,
        level: 1,
        x: 200,
        y: 0
    },
    shape: {
        id: 3,
        images: [
            {
                name: "00daeeb00b31e6f7fd9bf103a1733560.jpg",
                keywords: ["xxx", "health", "health", "health"],
                width: 131,
                height: 180
            },
            {
                name: "00dddfdfe4ad349925af78c3d04533f9.jpg",
                keywords: ["xxx", "health", "health", "health"],
                width: 116,
                height: 180
            }
        ],
        imageIndex: 0,
        level: 1,
        x: 200,
        y: 200
    },
    level: 0,
    x: 0,
    y: 0
}
```
除了数据结构，还有以下方法：
```javascript
/* 一个ImageTree实例有以下方法 */
get() => TreeNode // 当前树的根节点
// 以下都返回执行这次修改后，update过的树的根节点
initialize(res) => TreeNode
remove(id) => TreeNode // throws when id node found
explore(id, res) => TreeNode // throws when id not found
// 以下都返回指定id处的节点
find(id) => TreeNode | undefined
findParent(id) => TreeNode | undefined

_updateTreeXY() => number // 一般不需要外部调用，在init, remove, explore的时候会自动调用一次。更新每个节点的的x, y, 返回新的树的层数（从0开始数）

/* 一个TreeNode示例有 */
getImage() => Image // 返回当前imageIndex指向的图片
nextImage() => Image // 自增imageIndex并返回新图片
prevImage() => Image // 自减imageIndex并返回新图片
getThreeImages() => [Image, Image, Image] // 返回 [上一张，这一张，下一张]

/* 新增 */
setSelectedImage(image) // 传入一个Image 地址string
getSelectedImage() // get 当前的selectedImage 或者null
```
使用方式如下
```javascript
// 在新tab里面
const tree = new ImageTree(res);
tree.get() // 返回上述数据结构
// 或者
const tree = new ImageTree();
tree.get() // 错误！must initialize a tree first
tree.inizialize(res)
tree.get() // OK 返回上述结构

// 在点击轮播右箭头的时候
function handleNextImage(e) {
    // 从e获取轮播框节点id
    const imageObject = tree.find(id).nextImage()
    // 重新设置轮播框的img src=".."
}

// 在点击explore的时候
function handleExplore(e) {
    // 从e获取轮播框节点id
    const imageObject = tree.find(id).getImage()
    sendRequest(imageObject.name).then(
        res => renderTree(tree.explore(id, res))
    )
}

// 在点击remove的时候
function handleRemoveImage(e) {
    // 从e获取轮播框节点id
    renderTree(tree.remove(id))
}
```

### Refresh
* 一起Load到图片坑位，左右轮播

### History Record
* 保留搜索记录（包括keyword collection的点击结果和search input）

## Functions

### Left control panel

1. Searching (done)

    1). searching keywords with keywords
    
    2). searching images with keywords
    
2. Keywords history

3. Color palette

### Right mood-boarding area

1. Expand/Explore the mind map

    1). searching images with images

    2). searching keywords with images
    
2. Interaction history



