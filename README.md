# projects_MetaBoard_system

## Data Structure
### Explore
```
input: img_name
return: a dictionary
{
  "input": "01.jpg",
  "semantic": [{"name": "01.jpg", "keywords": "xxx", "width": 123, "height": 123},{"name": "02.jpg", "keywords": "xxx", "width": 123, "height": 123},...],
  "color": [{"name": "01.jpg", "keywords": "xxx", "width": 123, "height": 123},{"name": "02.jpg", "keywords": "xxx", "width": 123, "height": 123},...],
  "shape": [{"name": "01.jpg", "keywords": "xxx", "width": 123, "height": 123},{"name": "02.jpg", "keywords": "xxx", "width": 123, "height": 123},...],
  "status": ........
  ......
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
2. Iteraction history



