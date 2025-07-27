// utils/categories.js

export const categories = [
  { catId: 0, text: '全部', use_home_grid: false, use_list: true, grid_column: 3, grid_row: 3 },
  {
    catId: 1,
    text: '邻帮',
    icon: '/static/grids/Neighborhood.png',
    route: '/pages/category-tasks/index?catId=1&catName=邻帮',
    use_home_grid: true,
    use_list: true
  },
  {
    catId: 2,
    text: '跑腿',
    icon: '/static/grids/delivery.png',
    route: '/pages/category-tasks/index?catId=2&catName=跑腿',
    use_home_grid: true,
    use_list: true
  },
  {
    catId: 3,
    text: '家政',
    icon: '/static/grids/Housekeeping.png',
    route: '/pages/category-tasks/index?catId=3&catName=家政',
    use_home_grid: true,
    use_list: true
  },
  {
    catId: 4,
    text: '宠物',
    icon: '/static/grids/PetCare.png',
    route: '/pages/category-tasks/index?catId=4&catName=宠物',
    use_home_grid: true,
    use_list: true
  },
  {
    catId: 5,
    text: '维修',
    icon: '/static/grids/Maintenance.png',
    route: '/pages/category-tasks/index?catId=5&catName=维修',
    use_home_grid: true,
    use_list: true
  },
  {
    catId: 6,
    text: '陪诊',
    icon: '/static/grids/MedicalEscort.png',
    route: '/pages/category-tasks/index?catId=6&catName=陪诊',
    use_home_grid: true,
    use_list: true
  },
  {
    catId: 7,
    text: '趴活广场',
    icon: '/static/grids/JobMarket.png',
    route: '/pages/livelihood-square/index?catId=7&catName=趴活广场',
    use_home_grid: true,
    use_list: false
  },
  {
    catId: 8,
    text: '健身',
    icon: '/static/grids/sportTogether.png',
    route: '/pages/category-tasks/index?catId=8&catName=健身',
    use_home_grid: true,
    use_list: true
  },
  {
    catId: 9,
    text: '旅行',
    icon: '/static/grids/toTravel.png',
    route: '/pages/category-tasks/index?catId=9&catName=旅行',
    use_home_grid: true,
    use_list: true
  },
  {
    catId: 10,
    text: '吃喝',
    icon: '/static/grids/foods.png',
    route: '/pages/category-tasks/index?catId=10&catName=吃喝',
    use_home_grid: true,
    use_list: true
  },
  {
    catId: 99,
    text: '更多',
    icon: '/static/grids/more.png',
    route: '/pages/category-tasks/index?catId=99&catName=更多',
    use_home_grid: true,
    use_list: true
  }
]
