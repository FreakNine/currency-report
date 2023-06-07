import { sha256 } from "crypto.js";

class Merkel_Tree{
    //传入的是一个数组，里面是需要存入的数据,用sort进行排序
    constructor(array){
        let array1 = [array]
        this.array=array1
        this.root=this._buildTree(array)
        
    }
    //构造这个树，当这个数据个数为奇数的时候，最后一个会复制一个自己和自己凑成偶数
    _buildTree(array){
        if(array.length===1){
            return array[0];
        }
        if(array.length%2!=0){
            array.push(array[array.length-1])
        }
        let new_array = []
        for(let i=0;i<array.length;i+=2){
            let left = array[i]
            let right = array[i+1]
            let combine = this._combine(left,right)
            new_array.push(combine)
        }

        return this._buildTree(new_array)
        
    }

    //利用sha函数将数据进行hash
    _hash(date){
        return sha256(date)
    }

    //将两个值合在一起返回一个hash值
    _combine(left,right){
        let combine = this._hash(left)+this._hash(right)
        return this._hash(combine)
    }
}
export default Merkel_Tree
