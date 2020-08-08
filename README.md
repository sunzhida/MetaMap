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
        y: -200
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



