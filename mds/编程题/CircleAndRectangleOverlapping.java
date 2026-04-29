/**
 * 1401. 圆和矩形是否有重叠
 * 给你一个圆和一个矩形，请你判断它们是否有重叠的部分。
 * 1.圆由一个中心点和一个半径表示(radius, xCenter, yCenter)。
 * 2.矩形由其左下角和右上角的坐标表示(x1, y1, x2, y2)。(x1, y1) 是矩形左下角的坐标，(x2, y2) 是矩形右上角的坐标。
 * 如果圆和矩形有重叠的部分，请你返回 true ，否则返回 false 。
 * 
 * 条件
 * 1. 1 <= radius <= 2000
 * 2. -10^4 <= xCenter, yCenter <= 10^4
 * 3. -10^4 <= x1 < x2 <= 10^4
 * 4. -10^4 <= y1 < y2 <= 10^4
 * 5. 隐含条件 都为int 整型，可为负数
 */
public class CircleAndRectangleOverlapping {

    public static void main(String[] args) {
        CircleAndRectangleOverlapping s = new CircleAndRectangleOverlapping();
        System.out.println(s.checkOverlap(425, 335, 502, 203, 89, 320, 173));
    }

    public boolean checkOverlap(int radius, int xCenter, int yCenter, int x1, int y1, int x2, int y2) {
        boolean overlap = false;

        // 尝试边缘相交
        if (!overlap) {
            // 右边界
            overlap = ifEdgeOverlap(radius, xCenter, yCenter, x1, y1, x2, y2);
        }

        // 尝试全包含
        if (!overlap) {
            // 左边界
            overlap = ifContains(radius, xCenter, yCenter, x1, y1, x2, y2);
        }

        return overlap;
    }

    /**
     * 检测是否包含
     */
    private static boolean ifContains(int radius, int xCenter, int yCenter, int x1, int y1, int x2, int y2) {
        // 圆在矩形内
        if (xCenter + radius <= x2
                && xCenter - radius >= x1
                && yCenter + radius <= y2
                && yCenter - radius >= y1) {
            return true;
        }
        // 矩形在圆内
        if (Math.sqrt((x1 - xCenter) * (x1 - xCenter) + (y1 - yCenter) * (y1 - yCenter)) <= radius
                && Math.sqrt((x2 - xCenter) * (x2 - xCenter) + (y1 - yCenter) * (y1 - yCenter)) <= radius
                && Math.sqrt((x1 - xCenter) * (x1 - xCenter) + (y2 - yCenter) * (y2 - yCenter)) <= radius
                && Math.sqrt((x2 - xCenter) * (x2 - xCenter) + (y2 - yCenter) * (y2 - yCenter)) <= radius) {
            return true;
        }
        return false;
    }

    /**
     * 检测是否边缘相交
     */
    private static boolean ifEdgeOverlap(int radius, int xCenter, int yCenter, int x1, int y1, int x2, int y2) {
        // 尝试矩形边界
        return checkX(radius, xCenter, yCenter, x1, y1, y2)
                || checkX(radius, xCenter, yCenter, x2, y1, y2)
                || checkY(radius, xCenter, yCenter, y1, x1, x2)
                || checkY(radius, xCenter, yCenter, y2, x1, x2);
    }

    /**
     * 模拟矩形X边
     */
    private static boolean checkX(int radius, int xCenter, int yCenter, int x, int y1, int y2) {
        // x^2 + y^2 = r^2
        int yy = radius * radius - (x - xCenter) * (x - xCenter);
        if (yy >= 0) { // 有解
            // y1 <= y <= y2
            double y = Math.sqrt(yy) + yCenter;
            if (y >= y1 && y <= y2) {
                return true;
            }
            y = -Math.sqrt(yy) + yCenter;
            if (y >= y1 && y <= y2) {
                return true;
            }
        }
        return false;
    }

    /**
     * 模拟矩形Y边
     */
    private static boolean checkY(int radius, int xCenter, int yCenter, int y, int x1, int x2) {
        // x^2 + y^2 = r^2
        int xx = radius * radius - (y - yCenter) * (y - yCenter);
        if (xx >= 0) { // 有解
            // x1 <= x <= x2
            double x = Math.sqrt(xx) + xCenter;
            if (x >= x1 && x <= x2) {
                return true;
            }
            x = -Math.sqrt(xx) + xCenter;
            if (x >= x1 && x <= x2) {
                return true;
            }
        }
        return false;
    }
}

/***
 * 解题思路
 * 1.判断重叠，必然至少存在一个点，即属于圆形 又 属于方形。
 * 2。问题是点特别多，如何知道那个点呢 面上的点是无限的，
 * 3。既然重叠 意味着最少一个点 即在 圆+方 的边上。但点不一定是整数，也不一定是有理数
 * 4。是不是两个方程的求解呢
 * (x-xCenter)^2 + (y-yCenter)^2 <= radius^2 圆的方程
 * x1 <= x <= x2 && y1 <= y <= y2 矩形的方程
 */