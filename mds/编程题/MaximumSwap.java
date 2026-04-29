import java.util.ArrayList;

public class MaximumSwap {
    public static void main(String[] args) {
        MaximumSwap s = new MaximumSwap();
        int result = s.maximumSwap(1993);
        System.out.println(result);
    }

    private MaximumSwap() {

    }

    public int maximumSwap(int num) {
        ArrayList<Integer> arr = new ArrayList<>();
        split(arr, num);

        // 倒序遍历数组，找到第一个比后面小的数，其中最小的
        for (int i = arr.size() - 1; i >= 0; i--) {
            int target = arr.get(i);
            System.out.println("target: " + target);
            int max = target;
            int maxIndex = i;
            for (int j = i - 1; j >= 0; j--) {
                int temp = arr.get(j);
                System.out.println("temp: " + temp);
                if (temp > max) {
                    max = temp;
                    maxIndex = j;
                    System.out.println("max: " + max);
                } else if (temp == max) {
                    // 如果有多个相同的最大数，选择最右边的那个
                    maxIndex = j;
                }
            }
            if (target < max) {
                System.out.println("swap: " + target + " and " + max);
                // swap the two numbers
                int temp = arr.get(i);
                arr.set(i, arr.get(maxIndex));
                arr.set(maxIndex, temp);
                // 只交换一次
                break;
            }
        }

        // convert the array back to a number
        int result = 0;
        for (int k = arr.size() - 1; k >= 0; k--) {
            result = result * 10 + arr.get(k);
        }
        return result;
    }

    private static void split(ArrayList<Integer> arr, int num) {
        // System.out.println(num);
        if (num < 10) {
            arr.add(num);
            return;
        }

        // add the last digit to the list
        arr.add(num % 10);
        int newNum = num / 10;
        if (newNum == 0) { // if the new number is 0, we have reached the end of the number
            return;
        }
        // recursively call the function with the new number
        split(arr, newNum);
    }
}